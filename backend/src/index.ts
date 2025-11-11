import express from "express";
import { authenticate } from "../middleware.js";
import accessRoutes from "../routes/access.js";
import serverRoutes from "../routes/server.js";
import userRoutes from "../routes/user.js";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api/user", accessRoutes);
app.use(authenticate);
// Routes
app.use("/api", userRoutes);
app.use("/api", serverRoutes);

export default app;
