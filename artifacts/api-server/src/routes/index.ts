import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import agoraRouter from "./agora.js";
import roomsRouter from "./rooms.js";
import authRouter from "./auth.js";
import storiesRouter from "./stories.js";
import moderationRouter from "./moderation.js";
import mediaRouter from "./media.js";
import usersRouter from "./users.js";
import messagesRouter from "./messages.js";
import postsRouter from "./posts.js";
import followsRouter from "./follows.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agoraRouter);
router.use(roomsRouter);
router.use(authRouter);
router.use(storiesRouter);
router.use(moderationRouter);
router.use(mediaRouter);
router.use(usersRouter);
router.use(messagesRouter);
router.use(postsRouter);
router.use(followsRouter);

export default router;
