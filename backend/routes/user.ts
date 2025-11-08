import { Router } from "express";
import { getUserInfo } from "../controllers/user";

const app = Router();

app.get("/user/:discordId", getUserInfo);

export default app;
