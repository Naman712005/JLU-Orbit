require('dotenv').config();
if (!process.env.MONGO_URI) throw new Error('MONGO_URI not set');
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set');
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) console.warn('EMAIL_* not set; OTP email may fail');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
// server.js (add near top after server creation)
const { Server } = require("socket.io");


app.use(express.static(path.join(__dirname, 'html')));


app.get("/**", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "index.html"));
});


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
// safer CORS configuration — read allowed origin from env
const FRONTEND_URL = process.env.FRONTEND_URL || (process.env.RENDER_EXTERNAL_URL ? `https://${process.env.RENDER_EXTERNAL_URL}` : null);
app.use(cors({
  origin: FRONTEND_URL || false, // false blocks CORS when FRONTEND_URL is not provided
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: false // we use JWT in headers; no cookies needed. Set to true only if you use cookies and FRONTEND_URL is exact.
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ----------- Static files (uploads) -------------- */
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}



/* ---------------------- Dynamic front-end config ----------------------
   This responds to /config.js with JS that sets window.__CONFIG__.
   Render will serve this from the same web-service process.
--------------------------------------------------------------------- */
app.get('/config.js', (req, res) => {
  const apiBase = process.env.API_BASE || (process.env.RENDER_EXTERNAL_URL ? `https://${process.env.RENDER_EXTERNAL_URL}/api` : (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/api` : '/api'));
  const cfg = {
    API_BASE: apiBase,
    FRONTEND_URL: process.env.FRONTEND_URL || (process.env.RENDER_EXTERNAL_URL ? `https://${process.env.RENDER_EXTERNAL_URL}` : ''),
  };
  res.set('Content-Type', 'application/javascript');
  res.send(`window.__CONFIG__ = ${JSON.stringify(cfg)};`);
});


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
/* ---------------- Socket.IO setup ---------------- */
const io = new Server(server, {
  cors: {
    origin: "*",
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

// SPA fallback - return index.html for unknown non-API routes
app.get('*', (req, res) => {
  // Do not intercept API routes
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path === '/config.js') {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'html', 'index.html'));
});


/* =========================================================
   DATABASE CONNECTION + SERVER START
========================================================= */
const PORT = process.env.PORT || 4000;
const ENV = process.env.NODE_ENV || "development";

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');

    server.listen(PORT, () => {
      console.log(
        `🚀 Server running in ${ENV} mode on port ${PORT} (${ENV === "production"
          ? "https://" + process.env.RENDER_EXTERNAL_URL
          : "http://localhost:" + PORT
        })`
      );
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

