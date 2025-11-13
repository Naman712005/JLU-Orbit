const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middleware/authMiddleware");
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { io } = require("../server"); // ✅ import socket instance
const router = express.Router();

/* ------------ Multer setup -------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

/* =========================================================
   GET /api/posts
========================================================= */
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    const posts = await Post.find(filter)
      .populate("author", "name")
      .populate("comments.user", "name")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to load posts", details: err.message });
  }
});

/* =========================================================
   POST /api/posts/create
========================================================= */
router.post("/create", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { type, title, content, tags, image } = req.body;

    const normalizedTags = String(tags || "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const imagePath = req.file ? `/uploads/${req.file.filename}` : image || null;

    const post = await Post.create({
      author: req.user.id,
      type,
      title,
      content,
      image: imagePath,
      tags: normalizedTags,
    });

    const populated = await Post.findById(post._id).populate("author", "name");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: "Failed to create post", details: err.message });
  }
});

/* =========================================================
   PUT /api/posts/:postId
========================================================= */
router.put("/:postId", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { title, content, type, tags, image } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to update this post" });
    }

    if (title) post.title = title;
    if (content) post.content = content;
    if (type) post.type = type;
    if (tags) {
      post.tags = String(tags)
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    }
    if (req.file) post.image = `/uploads/${req.file.filename}`;
    else if (image) post.image = image;

    await post.save();

    const updated = await Post.findById(post._id).populate("author", "name");
    res.json({ success: true, message: "Post updated successfully", post: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update post", details: err.message });
  }
});

/* =========================================================
   DELETE /api/posts/:postId
========================================================= */
router.delete("/:postId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(req.params.postId);
    res.json({ success: true, message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post", details: err.message });
  }
});

/* =========================================================
   GET /api/posts/search/:keyword
========================================================= */
router.get("/search/:keyword", async (req, res) => {
  const keyword = String(req.params.keyword || "").toLowerCase();
  try {
    const posts = await Post.find({ tags: { $in: [new RegExp(keyword, "i")] } })
      .populate("author", "name")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to search posts", details: err.message });
  }
});

/* =========================================================
   GET /api/posts/my-posts
========================================================= */
router.get("/my-posts", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user.id })
      .populate("author", "name")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user posts", details: err.message });
  }
});

/* =========================================================
   POST /api/posts/:postId/like
========================================================= */
router.post("/:postId/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userId = req.user.id;
    const hasLiked = post.likes.some((id) => id.toString() === userId);

    if (hasLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);

      // ✅ Create and emit notification (only if not liking own post)
      if (post.author.toString() !== userId) {
        const actor = await User.findById(userId).select("name");
        const note = await Notification.create({
          user: post.author,
          message: `${actor?.name || "Someone"} liked your post "${post.title}"`,
          link: `/post/${post._id}`,
        });

        // ✅ Emit real-time notification to post owner
        io.to(post.author.toString()).emit("newNotification", note);
      }
    }

    await post.save();
    const liked = post.likes.some((id) => id.toString() === userId);
    res.json({ likesCount: post.likes.length, liked });
  } catch (err) {
    res.status(500).json({ error: "Failed to like/unlike post", details: err.message });
  }
});

/* =========================================================
   POST /api/posts/:postId/comment
========================================================= */
router.post("/:postId/comment", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.comments.push({ user: req.user.id, text: String(text).trim() });
    await post.save();

    // ✅ Create and emit comment notification
    if (post.author.toString() !== req.user.id) {
      const actor = await User.findById(req.user.id).select("name");
      const note = await Notification.create({
        user: post.author,
        message: `${actor?.name || "Someone"} commented on your post "${post.title}"`,
        link: `/post/${post._id}`,
      });

      io.to(post.author.toString()).emit("newNotification", note);
    }

    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ error: "Failed to add comment", details: err.message });
  }
});

/* =========================================================
   DELETE /api/posts/:postId/comment/:commentId
========================================================= */
router.delete("/:postId/comment/:commentId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const before = post.comments.length;
    post.comments = post.comments.filter(
      (c) =>
        !(
          c._id.toString() === req.params.commentId &&
          c.user.toString() === req.user.id
        )
    );

    if (post.comments.length === before) {
      return res.status(403).json({ error: "Not allowed to delete this comment" });
    }

    await post.save();
    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ error: "Failed to delete comment", details: err.message });
  }
});

/* =========================================================
   POST /api/posts/:id/share
========================================================= */
router.post("/:id/share", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.shares = (post.shares || 0) + 1;
    await post.save();

    res.json({ message: "Share recorded", shares: post.shares });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
