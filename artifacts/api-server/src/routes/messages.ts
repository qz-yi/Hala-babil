import { Router } from "express";
import { pool } from "@workspace/db";
import { authMiddleware, optionalAuth, type AuthRequest } from "../middlewares/auth.js";
import { getSocketIo } from "../lib/socketSingleton.js";
import { logger } from "../lib/logger.js";

const router = Router();

function normalizeMessage(row: Record<string, unknown>) {
  return {
    id: String(row["id"]),
    chatId: row["chat_id"] as number,
    senderId: String(row["sender_id"]),
    receiverId: String(row["receiver_id"]),
    content: row["content"] as string | null,
    mediaUrl: row["media_url"] as string | null,
    type: (row["type"] as string) ?? "text",
    duration: row["duration"] as number | null,
    isRead: Boolean(row["is_read"]),
    isDeleted: Boolean(row["is_deleted"]),
    sharedContent: row["shared_content"] ?? null,
    replyToId: row["reply_to_id"] as number | null,
    timestamp: new Date(row["created_at"] as string | Date).getTime(),
    read: Boolean(row["is_read"]),
  };
}

function normalizeChat(row: Record<string, unknown>) {
  return {
    id: row["id"] as number,
    user1Id: String(row["user1_id"]),
    user2Id: String(row["user2_id"]),
    lastActivity: new Date(row["last_activity"] as string | Date).getTime(),
    lastMessage: row["last_message"] ?? null,
    otherUserId: row["other_user_id"] ? String(row["other_user_id"]) : null,
  };
}

// ─── GET /api/chats ──────────────────────────────────────────────────────────
// Returns all private chats for the current user with last message
router.get("/chats", optionalAuth, async (req: AuthRequest, res) => {
  const userId = String(req.userId ?? req.query["userId"] ?? "");
  if (!userId) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    const result = await pool.query(
      `SELECT pc.*,
        CASE WHEN pc.user1_id = $1 THEN pc.user2_id ELSE pc.user1_id END as other_user_id,
        (SELECT row_to_json(pm.*) FROM private_messages pm
         WHERE pm.chat_id = pc.id AND pm.is_deleted = false
         ORDER BY pm.created_at DESC LIMIT 1) as last_message
       FROM private_chats pc
       WHERE pc.user1_id = $1 OR pc.user2_id = $1
       ORDER BY pc.last_activity DESC`,
      [userId]
    );

    return res.json({ chats: result.rows.map(normalizeChat) });
  } catch (err) {
    logger.error({ err }, "[messages] Failed to fetch chats");
    return res.status(500).json({ error: "chats_fetch_failed" });
  }
});

// ─── POST /api/chats ─────────────────────────────────────────────────────────
// Find or create a private chat between two users
router.post("/chats", optionalAuth, async (req: AuthRequest, res) => {
  const { userId: bodyUserId, otherUserId } = req.body as { userId?: string; otherUserId?: string };
  const userId = String(req.userId ?? bodyUserId ?? "");

  if (!userId || !otherUserId) {
    return res.status(400).json({ error: "missing_users" });
  }

  // Ensure deterministic ordering so we don't create duplicates
  const [u1, u2] = [userId, otherUserId].sort();

  try {
    let result = await pool.query(
      `SELECT * FROM private_chats WHERE user1_id = $1 AND user2_id = $2`,
      [u1, u2]
    );

    if (!result.rowCount || result.rowCount === 0) {
      result = await pool.query(
        `INSERT INTO private_chats (user1_id, user2_id) VALUES ($1, $2) RETURNING *`,
        [u1, u2]
      );
    }

    return res.json({ chat: normalizeChat({ ...result.rows[0], other_user_id: otherUserId }) });
  } catch (err) {
    logger.error({ err }, "[messages] Failed to create chat");
    return res.status(500).json({ error: "chat_create_failed" });
  }
});

// ─── GET /api/chats/:chatId/messages ────────────────────────────────────────
router.get("/chats/:chatId/messages", optionalAuth, async (req: AuthRequest, res) => {
  const { chatId } = req.params;
  const limit = Math.min(Number(req.query["limit"] ?? 50), 100);
  const before = req.query["before"] ? Number(req.query["before"]) : null;

  try {
    let query: string;
    let params: unknown[];

    if (before) {
      query = `SELECT * FROM private_messages
               WHERE chat_id = $1 AND is_deleted = false AND created_at < to_timestamp($2/1000.0)
               ORDER BY created_at DESC LIMIT $3`;
      params = [chatId, before, limit];
    } else {
      query = `SELECT * FROM private_messages
               WHERE chat_id = $1 AND is_deleted = false
               ORDER BY created_at DESC LIMIT $2`;
      params = [chatId, limit];
    }

    const result = await pool.query(query, params);
    const messages = result.rows.map(normalizeMessage).reverse();

    return res.json({ messages });
  } catch (err) {
    logger.error({ err }, "[messages] Failed to fetch messages");
    return res.status(500).json({ error: "messages_fetch_failed" });
  }
});

// ─── POST /api/chats/:chatId/messages ───────────────────────────────────────
router.post("/chats/:chatId/messages", optionalAuth, async (req: AuthRequest, res) => {
  const { chatId } = req.params;
  const {
    senderId: bodySenderId,
    receiverId,
    content,
    mediaUrl,
    type = "text",
    duration,
    sharedContent,
    replyToId,
  } = req.body as {
    senderId?: string;
    receiverId?: string;
    content?: string;
    mediaUrl?: string;
    type?: string;
    duration?: number;
    sharedContent?: unknown;
    replyToId?: number;
  };

  const senderId = String(req.userId ?? bodySenderId ?? "");

  if (!senderId || !receiverId) {
    return res.status(400).json({ error: "missing_fields" });
  }
  if (!content && !mediaUrl) {
    return res.status(400).json({ error: "empty_message" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO private_messages (chat_id, sender_id, receiver_id, content, media_url, type, duration, shared_content, reply_to_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
       RETURNING *`,
      [
        chatId,
        senderId,
        receiverId,
        content ?? null,
        mediaUrl ?? null,
        type,
        duration ?? null,
        sharedContent ? JSON.stringify(sharedContent) : null,
        replyToId ?? null,
      ]
    );

    // Update chat last_activity
    await pool.query(
      `UPDATE private_chats SET last_activity = NOW() WHERE id = $1`,
      [chatId]
    );

    const message = normalizeMessage(result.rows[0]);

    // Broadcast to recipient in real time
    const io = getSocketIo();
    if (io) {
      io.to(`user_${receiverId}`).emit("new-message", {
        chatId: Number(chatId),
        message,
      });
    }

    logger.info({ chatId, senderId, receiverId }, "[messages] Message sent");
    return res.status(201).json({ message });
  } catch (err) {
    logger.error({ err }, "[messages] Failed to send message");
    return res.status(500).json({ error: "message_send_failed" });
  }
});

// ─── PUT /api/chats/:chatId/messages/:messageId/read ─────────────────────────
router.put("/chats/:chatId/messages/:messageId/read", optionalAuth, async (_req, res) => {
  const { chatId, messageId } = _req.params;

  try {
    await pool.query(
      `UPDATE private_messages SET is_read = true WHERE id = $1 AND chat_id = $2`,
      [messageId, chatId]
    );
    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "[messages] Failed to mark read");
    return res.status(500).json({ error: "mark_read_failed" });
  }
});

// ─── PUT /api/chats/:chatId/read-all ─────────────────────────────────────────
router.put("/chats/:chatId/read-all", optionalAuth, async (req: AuthRequest, res) => {
  const { chatId } = req.params;
  const userId = String(req.userId ?? req.body?.userId ?? "");

  try {
    await pool.query(
      `UPDATE private_messages SET is_read = true WHERE chat_id = $1 AND receiver_id = $2`,
      [chatId, userId]
    );
    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "[messages] Failed to mark all read");
    return res.status(500).json({ error: "mark_read_failed" });
  }
});

// ─── DELETE /api/chats/:chatId/messages/:messageId ───────────────────────────
router.delete("/chats/:chatId/messages/:messageId", optionalAuth, async (_req, res) => {
  const { chatId, messageId } = _req.params;

  try {
    await pool.query(
      `UPDATE private_messages SET is_deleted = true WHERE id = $1 AND chat_id = $2`,
      [messageId, chatId]
    );
    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "[messages] Failed to delete message");
    return res.status(500).json({ error: "delete_failed" });
  }
});

export default router;
