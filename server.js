/********************* ENV CHECKS *********************/
require('dotenv').config();
if (!process.env.MONGO_URI) throw new Error('MONGO_URI not set');
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set');
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)
  console.warn('EMAIL_* not set; OTP email may fail');

/********************* IMPORTS *********************/
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");

/********************* URL NORMALIZER *********************/
const normalizeUrl = (url) => {
  if (!url) return null;
  return url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `https://${url}`;
};

/********************* APP + SERVER *********************/
const app = express();
const server = http.createServer(app);

/********************* CORS *********************/
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  (process.env.RENDER_EXTERNAL_URL
    ? normalizeUrl(process.env.RENDER_EXTERNAL_URL)
    : null);

app.use(cors({
  origin: FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: false
}));

console.log('🌐 CORS configured for origin:', FRONTEND_URL || "* (all origins)");

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/********************* STATIC FILES *********************/
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'html')));

/********************* DYNAMIC FRONTEND CONFIG *********************/
app.get('/config.js', (req, res) => {
  const apiBase =
    process.env.API_BASE ||
    (process.env.RENDER_EXTERNAL_URL
      ? normalizeUrl(process.env.RENDER_EXTERNAL_URL) + '/api'
      : '/api');

  const cfg = {
    API_BASE: apiBase,
    FRONTEND_URL: FRONTEND_URL || ""
  };

  res.type('application/javascript');
  res.send(`window.__CONFIG__ = ${JSON.stringify(cfg)};`);
});

/********************* API ROUTES *********************/
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/research', require('./routes/research'));
app.use('/api/profile', require('./routes/profiles'));
app.use('/api/search', require('./routes/search'));
app.use('/api/notifications', require('./routes/notifications'));

/********************* SOCKET.IO *********************/
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL || "*",
    methods: ["GET", "POST"]
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

/********************* SPA FALLBACK *********************/
app.use((req, res) => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/uploads') ||
    req.path === '/config.js'
  ) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

/********************* DB + SERVER START *********************/
const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
