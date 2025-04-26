const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "client/build")));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // your frontend origin
    methods: ["GET", "POST"],
  },
});

const userRoomMap = new Map(); // socket.id -> roomId

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  // User joins a specific room
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    userRoomMap.set(socket.id, roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Handle chat message
  socket.on("chat_message", (msg) => {
    const room = userRoomMap.get(socket.id);
    if (room) {
      console.log("Message sent from server ",msg);
      
      socket.to(room).emit("private", {msg});
    }
  });

  socket.on("voice_message", (data) => {
    const room = userRoomMap.get(socket.id);
    if (room) {
      console.log("Voice message sent from server", data);
      socket.to(room).emit("private", { audio: data.audio, sym: data.sym });
    }
  });

  socket.on("image_message", (data) => {
    const room = userRoomMap.get(socket.id);
    if (room) {
      console.log("Photo sent from user", data);
      socket.to(room).emit("private", data);
    }
  });
  
  

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    userRoomMap.delete(socket.id); // cleanup
  });

  
  
});

server.listen(4000, () => {
  console.log("Server running on port 4000");
});
