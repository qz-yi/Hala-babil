import { Router } from "express";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger.js";

const router = Router();

function normalizeStory(row: Record<string, unknown>) {
  const imageUrl = row["image_url"] as string | null;
  const content = row["content"] as string | null;

  return {
    id: String(row["id"]),
    creatorId: String(row["creator_id"]),
    imageUrl,
    mediaUrl: imageUrl ?? (row["media_url"] as string | null) ?? "",
    content,
    caption: content ?? (row["caption"] as string | null) ?? undefined,
    isCloseFriends: Boolean(row["is_close_friends"]),
    mentions: Array.isArray(row["mentions"]) ? row["mentions"] : [],
    expiresAt: new Date(row["expires_at"] as string | Date).getTime(),
    createdAt: new Date(row["created_at"] as string | Date).getTime(),
    mediaType: row["media_type"] === "video" ? "video" : "image",
    filter: (row["filter"] as string | null) ?? "none",
    sharedPost: row["shared_post"] ?? undefined,
    overlays: Array.isArray(row["overlays"]) ? row["overlays"] : [],
    viewerIds: Array.isArray(row["viewer_ids"]) ? row["viewer_ids"] : [],
  };
}

router.get("/stories", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, creator_id, image_url, content, is_close_friends, mentions, expires_at, created_at, media_type, filter, shared_post, overlays, viewer_ids, media_url, caption
       FROM stories
       WHERE expires_at > NOW()
       ORDER BY created_at DESC`,
    );

    return res.json({ stories: result.rows.map(normalizeStory) });
  } catch (err) {
    logger.error({ err }, "[stories] Failed to fetch active stories");
    return res.status(500).json({ error: "stories_fetch_failed" });
  }
});

router.post("/stories", async (req, res) => {
  const {
    creatorId,
    imageUrl,
    mediaUrl,
    content,
    caption,
    mediaType = "image",
    filter = "none",
    isCloseFriends = false,
    mentions = [],
    sharedPost = null,
    overlays = [],
  } = req.body as {
    creatorId?: string;
    imageUrl?: string;
    mediaUrl?: string;
    content?: string;
    caption?: string;
    mediaType?: "image" | "video";
    filter?: string;
    isCloseFriends?: boolean;
    mentions?: string[];
    sharedPost?: Record<string, unknown> | null;
    overlays?: { text: string }[];
  };

  const finalImageUrl = imageUrl ?? mediaUrl ?? "";
  const finalContent = content ?? caption ?? null;
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

  // Text-only stories (no media) are allowed when content or overlays exist
  const hasTextContent =
    (typeof finalContent === "string" && finalContent.trim().length > 0) ||
    (Array.isArray(overlays) && overlays.length > 0);

  if (!creatorId) {
    return res.status(400).json({ error: "missing_creator_id" });
  }
  if (!finalImageUrl && !hasTextContent) {
    return res.status(400).json({ error: "missing_story_content" });
  }

  if (expiresAt.getTime() <= Date.now()) {
    logger.error({ creatorId, expiresAt }, "[stories] Refusing to insert expired story");
    return res.status(500).json({ error: "story_expiration_invalid" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO stories
        (creator_id, image_url, content, is_close_friends, mentions, expires_at, created_at, media_type, filter, shared_post, overlays, viewer_ids, media_url, caption)
       VALUES
        ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10::jsonb, $11::jsonb, '[]'::jsonb, $2, $3)
       RETURNING id, creator_id, image_url, content, is_close_friends, mentions, expires_at, created_at, media_type, filter, shared_post, overlays, viewer_ids, media_url, caption`,
      [
        creatorId,
        finalImageUrl,
        finalContent,
        Boolean(isCloseFriends),
        JSON.stringify(Array.isArray(mentions) ? mentions.map(String) : []),
        expiresAt,
        createdAt,
        mediaType === "video" ? "video" : "image",
        filter,
        JSON.stringify(sharedPost),
        JSON.stringify(Array.isArray(overlays) ? overlays : []),
      ],
    );

    const story = normalizeStory(result.rows[0]);
    logger.info({ storyId: story.id, creatorId: story.creatorId, expiresAt: story.expiresAt }, "[stories] Database insertion result");

    return res.status(201).json({ story });
  } catch (err) {
    logger.error({ err, creatorId }, "[stories] Failed to insert story into database");
    return res.status(500).json({ error: "story_insert_failed" });
  }
});

export default router;