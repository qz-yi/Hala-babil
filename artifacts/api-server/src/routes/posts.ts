import { Router } from "express";
import { pool } from "@workspace/db";
import { optionalAuth, type AuthRequest } from "../middlewares/auth.js";
import { getSocketIo } from "../lib/socketSingleton.js";
import { logger } from "../lib/logger.js";

const router = Router();

function normalizePost(row: Record<string, unknown>) {
  return {
    id: String(row["id"]),
    creatorId: String(row["creator_id"]),
    creatorName: row["creator_name"] as string | null,
    creatorImage: row["creator_image"] as string | null,
    content: row["content"] as string | null,
    mediaUrl: row["media_url"] as string | null,
    mediaType: (row["media_type"] as string) ?? "none",
    likesCount: Number(row["likes_count"] ?? 0),
    commentsCount: Number(row["comments_count"] ?? 0),
    likedByMe: Boolean(row["liked_by_me"]),
    createdAt: new Date(row["created_at"] as string | Date).getTime(),
  };
}

// ─── GET /api/posts ──────────────────────────────────────────────────────────
router.get("/posts", optionalAuth, async (req: AuthRequest, res) => {
  const userId = String(req.userId ?? req.query["userId"] ?? "0");
  const limit = Math.min(Number(req.query["limit"] ?? 30), 100);
  const before = req.query["before"] ? Number(req.query["before"]) : null;

  try {
    let query: string;
    let params: unknown[];

    if (before) {
      query = `SELECT p.*,
          (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as comments_count,
          EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $2) as liked_by_me
         FROM posts p
         WHERE p.created_at < to_timestamp($3/1000.0)
         ORDER BY p.created_at DESC LIMIT $1`;
      params = [limit, userId, before];
    } else {
      query = `SELECT p.*,
          (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as comments_count,
          EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $2) as liked_by_me
         FROM posts p
         ORDER BY p.created_at DESC LIMIT $1`;
      params = [limit, userId];
    }

    const result = await pool.query(query, params);
    return res.json({ posts: result.rows.map(normalizePost) });
  } catch (err) {
    logger.error({ err }, "[posts] Failed to fetch posts");
    return res.status(500).json({ error: "posts_fetch_failed" });
  }
});

// ─── POST /api/posts ─────────────────────────────────────────────────────────
router.post("/posts", optionalAuth, async (req: AuthRequest, res) => {
  const { creatorId: bodyCreatorId, creatorName, creatorImage, content, mediaUrl, mediaType = "none" } = req.body as {
    creatorId?: string;
    creatorName?: string;
    creatorImage?: string;
    content?: string;
    mediaUrl?: string;
    mediaType?: string;
  };

  const creatorId = String(req.userId ?? bodyCreatorId ?? "");
  if (!creatorId) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!content && !mediaUrl) {
    return res.status(400).json({ error: "empty_post" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO posts (creator_id, creator_name, creator_image, content, media_url, media_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [creatorId, creatorName ?? null, creatorImage ?? null, content ?? null, mediaUrl ?? null, mediaType]
    );

    const post = normalizePost({ ...result.rows[0], likes_count: 0, comments_count: 0, liked_by_me: false });

    const io = getSocketIo();
    if (io) {
      io.emit("post:new", post);
    }

    logger.info({ postId: post.id, creatorId }, "[posts] Post created");
    return res.status(201).json({ post });
  } catch (err) {
    logger.error({ err }, "[posts] Failed to create post");
    return res.status(500).json({ error: "post_create_failed" });
  }
});

// ─── POST /api/posts/:postId/like ────────────────────────────────────────────
router.post("/posts/:postId/like", optionalAuth, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const { userId: bodyUserId } = req.body as { userId?: string };
  const userId = String(req.userId ?? bodyUserId ?? "");

  if (!userId) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    // Toggle like
    const existing = await pool.query(
      `SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    );

    let liked: boolean;
    if (existing.rowCount && existing.rowCount > 0) {
      await pool.query(`DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`, [postId, userId]);
      liked = false;
    } else {
      await pool.query(`INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)`, [postId, userId]);
      liked = true;
    }

    const countResult = await pool.query(`SELECT COUNT(*) as cnt FROM post_likes WHERE post_id = $1`, [postId]);
    const likesCount = Number(countResult.rows[0].cnt);

    const io = getSocketIo();
    if (io) {
      io.emit("post:liked", { postId, userId, liked, likesCount });
    }

    return res.json({ liked, likesCount });
  } catch (err) {
    logger.error({ err }, "[posts] Failed to toggle like");
    return res.status(500).json({ error: "like_failed" });
  }
});

// ─── GET /api/posts/:postId/comments ─────────────────────────────────────────
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM post_comments WHERE post_id = $1 ORDER BY created_at ASC`,
      [req.params["postId"]]
    );
    return res.json({
      comments: result.rows.map((row) => ({
        id: String(row.id),
        postId: String(row.post_id),
        userId: String(row.user_id),
        userName: row.user_name as string | null,
        userImage: row.user_image as string | null,
        content: row.content as string,
        createdAt: new Date(row.created_at as string).getTime(),
      })),
    });
  } catch (err) {
    logger.error({ err }, "[posts] Failed to fetch comments");
    return res.status(500).json({ error: "comments_fetch_failed" });
  }
});

// ─── POST /api/posts/:postId/comments ────────────────────────────────────────
router.post("/posts/:postId/comments", optionalAuth, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const { userId: bodyUserId, userName, userImage, content } = req.body as {
    userId?: string;
    userName?: string;
    userImage?: string;
    content?: string;
  };

  const userId = String(req.userId ?? bodyUserId ?? "");
  if (!userId || !content) {
    return res.status(400).json({ error: "missing_fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO post_comments (post_id, user_id, user_name, user_image, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [postId, userId, userName ?? null, userImage ?? null, content]
    );

    const comment = {
      id: String(result.rows[0].id),
      postId,
      userId,
      userName: userName ?? null,
      userImage: userImage ?? null,
      content,
      createdAt: new Date(result.rows[0].created_at as string).getTime(),
    };

    const io = getSocketIo();
    if (io) {
      io.emit("post:comment", { postId, comment });
    }

    return res.status(201).json({ comment });
  } catch (err) {
    logger.error({ err }, "[posts] Failed to add comment");
    return res.status(500).json({ error: "comment_failed" });
  }
});

// ─── DELETE /api/posts/:postId ───────────────────────────────────────────────
router.delete("/posts/:postId", optionalAuth, async (_req, res) => {
  const { postId } = _req.params;
  try {
    await pool.query(`DELETE FROM post_likes WHERE post_id = $1`, [postId]);
    await pool.query(`DELETE FROM post_comments WHERE post_id = $1`, [postId]);
    await pool.query(`DELETE FROM posts WHERE id = $1`, [postId]);
    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "[posts] Failed to delete post");
    return res.status(500).json({ error: "delete_failed" });
  }
});

export default router;
