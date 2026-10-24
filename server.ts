import express from "express";
import path from "path";
import dotenv from "dotenv";
import { apiRouter } from "./server/api-router.ts";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json());

// API routes
app.use("/api", apiRouter);

// Serve static frontend in production
const distPath = path.resolve(process.cwd(), "dist");
app.use(express.static(distPath));

// Fallback to index.html for SPA
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[EcoNiche Server] Server running on http://0.0.0.0:${PORT}`);
  console.log(`[EcoNiche Server] Active Provider: ${process.env.PROVIDER || "api"}`);
});
