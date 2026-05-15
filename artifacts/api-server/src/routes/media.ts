import { Router } from "express";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger.js";

const router = Router();

// Ensure the temporary_media table exists
async function ensureTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS temporary_media (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_data TEXT NOT NULL,
        mime_type VARCHAR(100) NOT NULL DEFAULT 'image/jpeg',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    // Auto-clean media older than 7 days
    await pool.query(`
      DELETE FROM temporary_media WHERE created_at < NOW() - INTERVAL '7 days'
    `);
  } catch (err) {
    logger.error({ err }, "[media] Failed to ensure temporary_media table");
  }
}

ensureTable();

// POST /api/media/upload — save Base64 media to PostgreSQL
router.post("/media/upload", async (req, res) => {
  try {
    const { fileData, mimeType = "image/jpeg" } = req.body as {
      fileData?: string;
      mimeType?: string;
    };

    if (!fileData) {
      return res.status(400).json({ error: "fileData is required" });
    }

    // Strip data URI prefix if present
    const base64Data = fileData.includes(",") ? fileData.split(",")[1] : fileData;

    if (!base64Data || base64Data.length === 0) {
      return res.status(400).json({ error: "fileData is empty" });
    }

    const result = await pool.query(
      `INSERT INTO temporary_media (file_data, mime_type)
       VALUES ($1, $2)
       RETURNING id, mime_type, created_at`,
      [base64Data, mimeType]
    );

    const row = result.rows[0];
    const mediaId = row.id as string;

    logger.info({ mediaId, mimeType, sizeKB: Math.round(base64Data.length * 0.75 / 1024) }, "[media] Uploaded media");

    return res.status(201).json({
      id: mediaId,
      url: `/api/media/${mediaId}`,
      mimeType: row.mime_type,
      createdAt: row.created_at,
    });
  } catch (err) {
    logger.error({ err }, "[media] Failed to upload media");
    return res.status(500).json({ error: "media_upload_failed" });
  }
});

// GET /api/media/:id — serve stored media
router.get("/media/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return res.status(400).json({ error: "invalid_id" });
    }

    const result = await pool.query(
      `SELECT file_data, mime_type FROM temporary_media WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "media_not_found" });
    }

    const { file_data, mime_type } = result.rows[0] as { file_data: string; mime_type: string };
    const buffer = Buffer.from(file_data, "base64");

    res.setHeader("Content-Type", mime_type);
    res.setHeader("Cache-Control", "public, max-age=604800");
    res.setHeader("Content-Length", buffer.length);
    return res.end(buffer);
  } catch (err) {
    logger.error({ err }, "[media] Failed to serve media");
    return res.status(500).json({ error: "media_fetch_failed" });
  }
});

export default router;
