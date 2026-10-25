import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { app } from "./app";
import { config } from "./config";
import { eventListener } from "./blockchain/eventListener";

const server = http.createServer(app);

// Socket.IO for real-time audit notifications and access revocation signals
export const io = new SocketIOServer(server, {
  cors: {
    origin: [config.clientOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`🔌 Client connected to WebSocket: ${socket.id}`);

  socket.on("subscribe:document", (docId: string) => {
    socket.join(`doc:${docId}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected from WebSocket: ${socket.id}`);
  });
});

// Attach socket server to blockchain event listener
eventListener.setSocketServer(io);

// Start server
server.listen(config.port, () => {
  console.log("====================================================");
  console.log(`🚀 DataLeak Ledger API running on port ${config.port}`);
  console.log(`📡 RPC URL:          ${config.rpcUrl}`);
  console.log(`📜 Contract Address: ${config.contractAddress}`);
  console.log(`🌐 Client Origin:    ${config.clientOrigin}`);
  console.log("====================================================");

  // Start background event listener
  eventListener.startListening().catch((err) => {
    console.warn("Could not immediately connect to Ethereum node:", err.message);
  });
});
