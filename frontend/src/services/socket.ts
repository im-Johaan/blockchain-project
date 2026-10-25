import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5001";

export let socket: Socket | null = null;

export function initSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("⚡ Connected to DataLeak Ledger WebSocket gateway:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Disconnected from WebSocket gateway");
    });
  }
  return socket;
}

export function getSocket(): Socket {
  return socket || initSocket();
}
