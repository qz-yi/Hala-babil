import { Router } from "express";
import { pool } from "@workspace/db";
import { optionalAuth, type AuthRequest } from "../middlewares/auth.js";
import { getSocketIo } from "../lib/socketSingleton.js";
import { logger } from "../lib/logger.js";

const router = Router();

function normalizeRoom(row: Record<string, unknown>) {
  return {
    id: String(row["id"]),
    name: row["name"] as string,
    description: row["description"] as string | null,
    image: row["room_image"] as string | null,
    roomCode: row["room_code"] as string | null,
    ownerId: String(row["creator_id"]),
    ownerName: row["creator_name"] as string | null,
    isVoiceActive: Boolean(row["is_voice_active"]),
    isHidden: Boolean(row["is_hidden"]),
    seats: (row["seats"] as (string | null)[]) ?? Array(8).fill(null),
    bannedUsers: (row["banned_users"] as string[]) ?? [],
    mutedUsers: (row["muted_users"] as string[]) ?? [],
    chat: (row["chat"] as unknown[]) ?? [],
    createdAt: new Date(row["created_at"] as string | Date).getTime(),
    presentUserIds: row["present_user_ids"] ?? [],
  };
}

function normalizeParticipant(row: Record<string, unknown>) {
  return {
    id: String(row["user_id"]),
    name: row["user_name"] as string | null,
    image: row["user_image"] as string | null,
    seatIndex: row["seat_index"] as number,
    joinedAt: new Date(row["joined_at"] as string | Date).getTime(),
  };
}

// ─── GET /api/rooms ──────────────────────────────────────────────────────────
router.get("/rooms", optionalAuth, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
        COALESCE(
          (SELECT jsonb_agg(jsonb_build_object('userId', rp.user_id, 'seatIndex', rp.seat_index))
           FROM room_participants rp WHERE rp.room_id = r.id),
          '[]'::jsonb
        ) as participants
       FROM rooms r
       WHERE r.is_hidden = false
       ORDER BY r.created_at DESC
       LIMIT 100`
    );

    const rooms = result.rows.map((row) => ({
      ...normalizeRoom(row),
      presentUserIds: ((row["participants"] as { userId: string }[]) ?? []).map((p) => p.userId),
      seatUsers: Array(8).fill(null).map((_, i) => {
        const p = ((row["participants"] as { userId: string; seatIndex: number }[]) ?? []).find(
          (x) => x.seatIndex === i
        );
        return p ? { id: p.userId } : null;
      }),
    }));

    return res.json({ rooms });
  } catch (err) {
    logger.error({ err }, "[rooms] Failed to fetch rooms");
    return res.status(500).json({ error: "rooms_fetch_failed" });
  }
});

// ─── POST /api/rooms ─────────────────────────────────────────────────────────
router.post("/rooms", optionalAuth, async (req: AuthRequest, res) => {
  const { name, description, image, ownerId, ownerName, roomCode, seats } = req.body as {
    name?: string;
    description?: string;
    image?: string;
    ownerId?: string;
    ownerName?: string;
    roomCode?: string;
    seats?: (string | null)[];
  };

  if (!name) {
    return res.status(400).json({ error: "missing_name" });
  }

  const creatorId = ownerId ?? String(req.userId ?? "anonymous");

  try {
    const result = await pool.query(
      `INSERT INTO rooms (name, description, room_image, creator_id, creator_name, room_code, seats, is_voice_active, is_hidden)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, true, false)
       RETURNING *`,
      [
        name.trim(),
        description ?? null,
        image ?? null,
        creatorId,
        ownerName ?? null,
        roomCode ?? null,
        JSON.stringify(seats ?? Array(8).fill(null)),
      ]
    );

    const room = normalizeRoom(result.rows[0]);

    // Auto-join creator in seat 0
    await pool.query(
      `INSERT INTO room_participants (room_id, user_id, user_name, user_image, seat_index)
       VALUES ($1, $2, $3, $4, 0)
       ON CONFLICT DO NOTHING`,
      [result.rows[0].id, creatorId, ownerName ?? null, null]
    );

    const io = getSocketIo();
    if (io) {
      io.emit("room:created", room);
      // Broadcast the full rooms list so every client can do a full replace
      const allRooms = await pool.query(`SELECT * FROM rooms ORDER BY created_at DESC`);
      io.emit("rooms_update", allRooms.rows.map(normalizeRoom));
      console.log(`📡 [SERVER] rooms_update broadcast — ${allRooms.rowCount} rooms after create`);
    }

    logger.info({ roomId: room.id, creatorId }, "[rooms] Room created");
    return res.status(201).json({ room });
  } catch (err) {
    logger.error({ err }, "[rooms] Failed to create room");
    return res.status(500).json({ error: "room_create_failed" });
  }
});

// ─── GET /api/rooms/:roomId ──────────────────────────────────────────────────
router.get("/rooms/:roomId", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM rooms WHERE id = $1`, [req.params["roomId"]]);
    if (!result.rowCount || result.rowCount === 0) {
      return res.status(404).json({ error: "room_not_found" });
    }

    const participantsResult = await pool.query(
      `SELECT * FROM room_participants WHERE room_id = $1`,
      [req.params["roomId"]]
    );

    return res.json({
      room: normalizeRoom(result.rows[0]),
      participants: participantsResult.rows.map(normalizeParticipant),
    });
  } catch (err) {
    logger.error({ err }, "[rooms] Failed to get room");
    return res.status(500).json({ error: "room_get_failed" });
  }
});

// ─── POST /api/rooms/:roomId/join ────────────────────────────────────────────
router.post("/rooms/:roomId/join", optionalAuth, async (req: AuthRequest, res) => {
  const { userId, userName, userImage, seatIndex = -1 } = req.body as {
    userId?: string;
    userName?: string;
    userImage?: string;
    seatIndex?: number;
  };

  const uid = userId ?? String(req.userId ?? "");
  if (!uid) {
    return res.status(400).json({ error: "missing_user_id" });
  }

  const roomId = req.params["roomId"];

  try {
    // Upsert participant
    await pool.query(
      `INSERT INTO room_participants (room_id, user_id, user_name, user_image, seat_index)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (room_id, user_id) DO UPDATE
         SET seat_index = $5, user_name = $3, user_image = $4, joined_at = NOW()`,
      [roomId, uid, userName ?? null, userImage ?? null, seatIndex]
    );

    // Update seats in room if seatIndex >= 0
    if (seatIndex >= 0) {
      const roomResult = await pool.query(`SELECT seats FROM rooms WHERE id = $1`, [roomId]);
      if (roomResult.rowCount && roomResult.rowCount > 0) {
        const seats = (roomResult.rows[0].seats as (string | null)[]) ?? Array(8).fill(null);
        // Remove user from any existing seat
        const cleaned = seats.map((s: string | null) => (s === uid ? null : s));
        cleaned[seatIndex] = uid;
        await pool.query(`UPDATE rooms SET seats = $1::jsonb WHERE id = $2`, [JSON.stringify(cleaned), roomId]);
      }
    }

    const io = getSocketIo();
    if (io) {
      io.to(`room_${roomId}`).emit("room:participant-joined", { roomId, userId: uid, userName, userImage, seatIndex });
    }

    logger.info({ roomId, userId: uid, seatIndex }, "[rooms] User joined room");
    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "[rooms] Failed to join room");
    return res.status(500).json({ error: "join_failed" });
  }
});

// ─── POST /api/rooms/:roomId/leave ───────────────────────────────────────────
router.post("/rooms/:roomId/leave", optionalAuth, async (req: AuthRequest, res) => {
  const { userId } = req.body as { userId?: string };
  const uid = userId ?? String(req.userId ?? "");
  const roomId = req.params["roomId"];

  try {
    // Get current seat before removing
    const participantResult = await pool.query(
      `SELECT seat_index FROM room_participants WHERE room_id = $1 AND user_id = $2`,
      [roomId, uid]
    );

    await pool.query(
      `DELETE FROM room_participants WHERE room_id = $1 AND user_id = $2`,
      [roomId, uid]
    );

    // Clear seat in room
    const seatIdx = participantResult.rows[0]?.seat_index as number ?? -1;
    if (seatIdx >= 0) {
      const roomResult = await pool.query(`SELECT seats FROM rooms WHERE id = $1`, [roomId]);
      if (roomResult.rowCount && roomResult.rowCount > 0) {
        const seats = (roomResult.rows[0].seats as (string | null)[]) ?? Array(8).fill(null);
        const cleaned = seats.map((s: string | null) => (s === uid ? null : s));
        await pool.query(`UPDATE rooms SET seats = $1::jsonb WHERE id = $2`, [JSON.stringify(cleaned), roomId]);
      }
    }

    const io = getSocketIo();
    if (io) {
      io.to(`room_${roomId}`).emit("room:participant-left", { roomId, userId: uid });
    }

    logger.info({ roomId, userId: uid }, "[rooms] User left room");
    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "[rooms] Failed to leave room");
    return res.status(500).json({ error: "leave_failed" });
  }
});

// ─── GET /api/rooms/:roomId/participants ─────────────────────────────────────
router.get("/rooms/:roomId/participants", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM room_participants WHERE room_id = $1 ORDER BY joined_at ASC`,
      [req.params["roomId"]]
    );
    return res.json({ participants: result.rows.map(normalizeParticipant) });
  } catch (err) {
    logger.error({ err }, "[rooms] Failed to get participants");
    return res.status(500).json({ error: "participants_failed" });
  }
});

// ─── POST /api/rooms/:roomId/message ─────────────────────────────────────────
router.post("/rooms/:roomId/message", optionalAuth, async (req: AuthRequest, res) => {
  const { userId, userName, content, type = "text" } = req.body as {
    userId?: string;
    userName?: string;
    content?: string;
    type?: string;
  };

  const uid = userId ?? String(req.userId ?? "");
  const roomId = req.params["roomId"];

  if (!content) {
    return res.status(400).json({ error: "missing_content" });
  }

  try {
    const msg = {
      id: `${Date.now()}-${uid.slice(-4)}`,
      senderId: uid,
      senderName: userName ?? "مجهول",
      content,
      type,
      timestamp: Date.now(),
    };

    // Append to room chat (keep last 200 messages)
    await pool.query(
      `UPDATE rooms
       SET chat = (
         SELECT jsonb_agg(m)
         FROM (
           SELECT jsonb_array_elements(chat) m
           UNION ALL
           SELECT $1::jsonb
           LIMIT 200
         ) sub
       )
       WHERE id = $2`,
      [JSON.stringify(msg), roomId]
    );

    const io = getSocketIo();
    if (io) {
      io.to(`room_${roomId}`).emit("room:message", { roomId, message: msg });
    }

    return res.status(201).json({ message: msg });
  } catch (err) {
    logger.error({ err }, "[rooms] Failed to send room message");
    return res.status(500).json({ error: "message_failed" });
  }
});

// ─── DELETE /api/rooms/:roomId ───────────────────────────────────────────────
router.delete("/rooms/:roomId", optionalAuth, async (req: AuthRequest, res) => {
  const roomId = req.params["roomId"];

  try {
    await pool.query(`DELETE FROM room_participants WHERE room_id = $1`, [roomId]);
    await pool.query(`DELETE FROM rooms WHERE id = $1`, [roomId]);

    const io = getSocketIo();
    if (io) {
      io.emit("room:deleted", { roomId });
      // Broadcast updated full rooms list so every client replaces their state
      const allRooms = await pool.query(`SELECT * FROM rooms ORDER BY created_at DESC`);
      io.emit("rooms_update", allRooms.rows.map(normalizeRoom));
      console.log(`📡 [SERVER] rooms_update broadcast — ${allRooms.rowCount} rooms after delete`);
    }

    logger.info({ roomId }, "[rooms] Room deleted");
    return res.json({ ok: true, roomId });
  } catch (err) {
    logger.error({ err }, "[rooms] Failed to delete room");
    return res.status(500).json({ error: "delete_failed" });
  }
});

export default router;
