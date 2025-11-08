import express from "express";
import { authenticate } from "./middleware";
import accessRoutes from "./routes/access";
import serverRoutes from "./routes/server";
import userRoutes from "./routes/user";

const app = express();

// Middleware
app.use(express.json());

app.use(authenticate);

// Routes
app.use("/api", userRoutes);
app.use("/api", serverRoutes);
app.use("/api", accessRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(3000, () => {
  console.log("🚀 Server is running on port 3000");
});
