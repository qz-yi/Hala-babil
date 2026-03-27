import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agoraRouter from "./agora";
import roomsRouter from "./rooms";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agoraRouter);
router.use(roomsRouter);

export default router;
