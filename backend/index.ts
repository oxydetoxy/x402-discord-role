import express from "express";
import { authenticate } from "./middleware";
import accessRoutes from "./routes/access";
import serverRoutes from "./routes/server";
import userRoutes from "./routes/user";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/user", accessRoutes);
app.use(authenticate);
// Routes
app.use("/api", userRoutes);
app.use("/api", serverRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(3001, () => {
  console.log("🚀 Server is running on port 3000");
});
