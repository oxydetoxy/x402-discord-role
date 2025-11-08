import { Router } from "express";
import {
  getAllServers,
  getChannelById,
  getServerById,
} from "../controllers/server";

const router = Router();

// GET routes
router.get("/servers", getAllServers);
router.get("/server/:serverId", getServerById);
router.get("/channel/:channelId", getChannelById);

export default router;
