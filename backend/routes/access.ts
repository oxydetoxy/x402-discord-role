import { Router } from "express";
import { getAccess } from "../controllers/access";

const app = Router();

app.get(
  "/access/network/:networkId/server/:serverId/channel/:channelId/user/:discordId",
  getAccess
);

export default app;
