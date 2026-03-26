import { Router } from "express";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";

const router = Router();

router.post("/agora/token", (req, res) => {
  const appId = process.env["AGORA_APP_ID"];
  const appCertificate = process.env["AGORA_APP_CERTIFICATE"];

  if (!appId || !appCertificate) {
    return res.status(500).json({ error: "Agora credentials not configured" });
  }

  const { channelName, uid, role } = req.body as {
    channelName: string;
    uid?: number;
    role?: "publisher" | "subscriber";
  };

  if (!channelName) {
    return res.status(400).json({ error: "channelName is required" });
  }

  const tokenUid = uid ?? 0;
  const rtcRole = role === "subscriber" ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    tokenUid,
    rtcRole,
    privilegeExpiredTs
  );

  return res.json({
    token,
    uid: tokenUid,
    channelName,
    appId,
    expiresAt: privilegeExpiredTs * 1000,
  });
});

export default router;
