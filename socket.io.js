const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

// Socket.io connection
io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg); // broadcast to all clients
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

http.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});