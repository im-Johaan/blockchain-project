import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "./config";

import authRoutes from "./routes/authRoutes";
import documentRoutes from "./routes/documentRoutes";
import accessRoutes from "./routes/accessRoutes";
import downloadRoutes from "./routes/downloadRoutes";
import forensicsRoutes from "./routes/forensicsRoutes";
import blockchainRoutes from "./routes/blockchainRoutes";

export const app = express();

// Middleware
app.use(
  cors({
    origin: [config.clientOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    exposedHeaders: ["Content-Disposition", "X-Issuance-Tx", "X-Issuance-Block"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    contractAddress: config.contractAddress,
    rpcUrl: config.rpcUrl,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/documents", accessRoutes);
app.use("/api/documents", downloadRoutes);
app.use("/api/forensics", forensicsRoutes);
app.use("/api/blockchain", blockchainRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
  });
});
