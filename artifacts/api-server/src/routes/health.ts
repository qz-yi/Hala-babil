import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

// Stable instance ID — identifies this specific server process
const INSTANCE_ID = randomUUID().slice(0, 8);

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

/**
 * Proof-of-concept connectivity endpoint.
 * Both devices must receive identical instanceId to confirm they share one server.
 * serverTime will differ between calls — confirms live server clock.
 */
router.get("/ping", (_req, res) => {
  res.json({
    ok: true,
    instanceId: INSTANCE_ID,
    serverTime: new Date().toISOString(),
    serverTimeMs: Date.now(),
    message: "pong — you are connected to the shared server instance",
  });
});

export default router;
