import { Router } from "express";
import { pool } from "@workspace/db";
import { optionalAuth, type AuthRequest } from "../middlewares/auth.js";
import { getSocketIo } from "../lib/socketSingleton.js";
import { logger } from "../lib/logger.js";

const router = Router();

// ─── POST /api/follows/:userId ───────────────────────────────────────────────
// Toggle follow/unfollow
router.post("/follows/:targetUserId", optionalAuth, async (req: AuthRequest, res) => {
  const { targetUserId } = req.params;
  const { followerId: bodyFollowerId } = req.body as { followerId?: string };
  const followerId = String(req.userId ?? bodyFollowerId ?? "");

  if (!followerId || followerId === targetUserId) {
    return res.status(400).json({ error: "invalid_request" });
  }

  try {
    const existing = await pool.query(
      `SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2`,
      [followerId, targetUserId]
    );

    let following: boolean;
    if (existing.rowCount && existing.rowCount > 0) {
      await pool.query(`DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`, [followerId, targetUserId]);
      following = false;
    } else {
      await pool.query(
        `INSERT INTO follows (follower_id, following_id, status) VALUES ($1, $2, 'accepted')`,
        [followerId, targetUserId]
      );
      following = true;

      // Notify target user
      const io = getSocketIo();
      if (io) {
        io.to(`user_${targetUserId}`).emit("new-follow", { followerId });
      }
    }

    return res.json({ following });
  } catch (err) {
    logger.error({ err }, "[follows] Failed to toggle follow");
    return res.status(500).json({ error: "follow_failed" });
  }
});

// ─── GET /api/follows/status/:targetUserId ───────────────────────────────────
router.get("/follows/status/:targetUserId", optionalAuth, async (req: AuthRequest, res) => {
  const { targetUserId } = req.params;
  const { followerId: queryFollowerId } = req.query;
  const followerId = String(req.userId ?? queryFollowerId ?? "");

  if (!followerId) {
    return res.json({ following: false });
  }

  try {
    const result = await pool.query(
      `SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2`,
      [followerId, targetUserId]
    );
    return res.json({ following: (result.rowCount ?? 0) > 0 });
  } catch (err) {
    logger.error({ err }, "[follows] Failed to check follow status");
    return res.status(500).json({ error: "status_failed" });
  }
});

// ─── GET /api/users/:userId/followers ────────────────────────────────────────
router.get("/users/:userId/followers", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.username, u.image
       FROM follows f
       JOIN users u ON u.id::text = f.follower_id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC LIMIT 100`,
      [req.params["userId"]]
    );
    return res.json({ followers: result.rows.map((r) => ({ ...r, id: String(r.id) })) });
  } catch (err) {
    logger.error({ err }, "[follows] Failed to get followers");
    return res.status(500).json({ error: "followers_failed" });
  }
});

// ─── GET /api/users/:userId/following ────────────────────────────────────────
router.get("/users/:userId/following", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.username, u.image
       FROM follows f
       JOIN users u ON u.id::text = f.following_id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC LIMIT 100`,
      [req.params["userId"]]
    );
    return res.json({ following: result.rows.map((r) => ({ ...r, id: String(r.id) })) });
  } catch (err) {
    logger.error({ err }, "[follows] Failed to get following");
    return res.status(500).json({ error: "following_failed" });
  }
});

export default router;
