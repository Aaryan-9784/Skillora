import { io } from "socket.io-client";
import tokenStore from "./tokenStore";

let socket = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;

  const token = tokenStore.get();
  if (!token) return null;

  socket = io(import.meta.env.VITE_SERVER_URL || "http://localhost:5000", {
    auth:       { token },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay:    2000,
  });

  socket.on("connect",       () => console.log("[socket] connected"));
  socket.on("disconnect",    () => console.log("[socket] disconnected"));
  socket.on("connect_error", (e) => console.warn("[socket] error:", e.message));

  return socket;
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

export const getSocket = () => socket;
