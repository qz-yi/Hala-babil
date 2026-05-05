import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import agoraRouter from "./agora.js";
import roomsRouter from "./rooms.js";
import authRouter from "./auth.js";
import storiesRouter from "./stories.js";
import moderationRouter from "./moderation.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agoraRouter);
router.use(roomsRouter);
router.use(authRouter);
router.use(storiesRouter);
router.use(moderationRouter);

export default router;
