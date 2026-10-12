import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const PORT = Number(process.env.REALTIME_PORT || 3001);
const app = express();
app.use(cors());
app.get("/health", (_req, res) => {
  res.json({ service: "nexora-realtime", status: "ok" });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  socket.emit("system:connected", {
    socketId: socket.id,
    message: "Connected to NEXORA realtime service"
  });

  socket.on("presence:join", (payload) => {
    socket.broadcast.emit("presence:update", {
      ...payload,
      status: "online"
    });
  });

  socket.on("chat:message", (payload) => {
    io.emit("chat:message", {
      ...payload,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on("disconnect", () => {
    io.emit("presence:offline", { socketId: socket.id });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`NEXORA realtime service running on http://127.0.0.1:${PORT}`);
});
