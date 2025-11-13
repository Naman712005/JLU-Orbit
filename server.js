require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
// server.js (add near top after server creation)
const { Server } = require("socket.io");



/* ---------------- Import Routes ---------------- */
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const groupRoutes = require('./routes/groups');
const researchRoutes = require('./routes/research');
const profileroutes = require('./routes/profiles');
const searchRoutes = require('./routes/search');
const notificationRoutes = require("./routes/notifications");

/* ---------------- Express + HTTP setup ---------------- */
const app = express();
const server = http.createServer(app); // ✅ needed for Socket.IO

/* ---------------- Core middleware ---------------- */
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ----------- Static files (uploads) -------------- */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ✅ added for Railway deployment: Serve frontend from /html */
app.use(express.static(path.join(__dirname, 'html')));

/* --------------------- Routes -------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/profile', profileroutes);
app.use('/api/search', searchRoutes);
app.use("/api/notifications", notificationRoutes);

// Optional health / root route (good for Render)
app.get('/', (req, res) => res.send('✅ FastConnect backend is running'));

/* ✅ added for Railway deployment: fallback for frontend routes */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

/* --------------- Environment checks -------------- */
if (!process.env.MONGO_URI) {
  console.error('Error: MONGO_URI not set in .env');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET not set; auth middleware will fail verification if tokens are issued with another secret');
}

/* --------------- Frontend Config (for API_BASE) --------------- */
app.get("/config.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.send(`window.__CONFIG__ = { API_BASE: "${process.env.API_BASE}" };`);
});

const io = new Server(server, {
  cors: {
    origin: [
      "https://fast-connect-mu.vercel.app", // replace with actual domain
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});
const onlineUsers = new Map();
app.set("io", io);
app.set("onlineUsers", onlineUsers);

io.on("connection", (socket) => {
  socket.on("register", (userId) => {
    if (userId) onlineUsers.set(String(userId), socket.id);
  });

  socket.on("disconnect", () => {
    for (const [u, s] of onlineUsers.entries())
      if (s === socket.id) onlineUsers.delete(u);
  });
});


/* =========================================================
   DATABASE CONNECTION + SERVER START
========================================================= */
const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

