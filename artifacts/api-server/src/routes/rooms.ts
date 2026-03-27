import { Router } from "express";

const router = Router();

// Best-effort endpoint to satisfy client-side API call for room deletion.
// Currently the demo backend doesn't persist rooms; the client still updates
// its local UI state immediately.
router.delete("/rooms/:roomId", (req, res) => {
  const { roomId } = req.params;
  return res.json({ ok: true, roomId });
});

export default router;

