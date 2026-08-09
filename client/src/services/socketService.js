import { io } from "socket.io-client";
import tokenStore from "./tokenStore";

let socket = null;

export const connectSocket = () => {
  const token = tokenStore.get();

  if (socket) {
    if (socket.connected) return socket;
    if (token) socket.auth = { token };
    if (!socket.connecting) {
      socket.connect();
    }
    return socket;
  }

  socket = io(import.meta.env.VITE_SERVER_URL || "http://localhost:5000", {
    auth: { token },
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => console.log("[socket] connected:", socket.id));
  socket.on("disconnect", (reason) => console.log("[socket] disconnected:", reason));
  socket.on("connect_error", (e) => console.warn("[socket] error:", e.message));

  return socket;
};

export const updateSocketToken = (newToken) => {
  if (!newToken) return;
  if (socket) {
    socket.auth = { token: newToken };
    if (!socket.connected) {
      socket.connect();
    }
  } else {
    connectSocket();
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  if (!socket || !socket.connected) {
    connectSocket();
  }
  return socket;
};
