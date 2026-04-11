import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import agoraRouter from "./agora.js";
import roomsRouter from "./rooms.js";
import authRouter from "./auth.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agoraRouter);
router.use(roomsRouter);
router.use(authRouter);

export default router;
