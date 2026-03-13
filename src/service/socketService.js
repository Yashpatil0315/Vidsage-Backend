const cookie = require("cookie");
const { getUser } = require("../service/auth");

module.exports = function socketService(io) {

  // 🔐 Socket authentication (cookie-based or auth object)
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      
      // Fallback to cookies if no auth token provided
      if (!token && socket.handshake.headers.cookie) {
        const parsed = cookie.parse(socket.handshake.headers.cookie);
        token = parsed.token;
      }

      if (!token) return next(new Error("No token provided"));

      const user = getUser(token);
      if (!user) return next(new Error("Invalid token"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.user.email);

    // Join video/job room
    socket.on("join-room", (jobId) => {
      socket.join(jobId);
    });

    // Chat message (shared)
    socket.on("chat-message", ({ jobId, message }) => {
      socket.to(jobId).emit("chat-message", {
        user: {
          id: socket.user._id,
          email: socket.user.email,
          name: socket.user.name || socket.user.email.split('@')[0]
        },
        message,
        time: Date.now()
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.user.email);
    });
  });
};
