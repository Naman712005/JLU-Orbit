const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const authMiddleware = require("../middleware/authMiddleware"); // adjust path
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { upload, isCloudinaryConfigured, uploadToCloudinary } = require("../utils/cloudinary");

const router = express.Router();

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
    res
      .status(500)
      .json({ error: "Failed to load posts", details: err.message });
  }
});

/* =========================================================
   POST /api/posts/create
========================================================= */
router.post(
  "/create",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const { type, title, content, tags, image } = req.body;

      const normalizedTags = String(tags || "")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      // Handle image upload
      let imagePath = image || null;
      
      if (req.file) {
        // If Cloudinary is configured, upload to cloud
        if (isCloudinaryConfigured()) {
          try {
            imagePath = await uploadToCloudinary(req.file.path);
          } catch (cloudError) {
            console.error('Cloudinary upload failed:', cloudError);
            // Fall back to local path if Cloudinary fails
            imagePath = `/uploads/${req.file.filename}`;
          }
        } else {
          // Use local path
          imagePath = `/uploads/${req.file.filename}`;
        }
      }

      const post = await Post.create({
        author: req.user.id,
        type,
        title,
        content,
        image: imagePath,
        tags: normalizedTags,
      });

      const populated = await Post.findById(post._id).populate(
        "author",
        "name"
      );

      res.status(201).json(populated);
    } catch (err) {
      res
        .status(500)
        .json({ error: "Failed to create post", details: err.message });
    }
  }
);

/* =========================================================
   PUT /api/posts/:postId Updates title/content/type/tags/image (only author)
========================================================= */
router.put(
  "/:postId",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, content, type, tags, image } = req.body;
      const post = await Post.findById(req.params.postId);
      if (!post) return res.status(404).json({ error: "Post not found" });

      if (post.author.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ error: "You are not authorized to update this post" });
      }

      // Update fields if provided
      if (title) post.title = title;
      if (content) post.content = content;
      if (type) post.type = type;
      if (tags) {
        post.tags = String(tags)
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
      }

      // Update image if new one is uploaded or provided
      if (req.file) {
        if (isCloudinaryConfigured()) {
          try {
            post.image = await uploadToCloudinary(req.file.path);
          } catch (cloudError) {
            console.error('Cloudinary upload failed:', cloudError);
            post.image = `/uploads/${req.file.filename}`;
          }
        } else {
          post.image = `/uploads/${req.file.filename}`;
        }
      } else if (image) {
        post.image = image;
      }

      await post.save();

      const updated = await Post.findById(post._id).populate("author", "name");

      res.json({
        success: true,
        message: "Post updated successfully",
        post: updated,
      });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Failed to update post", details: err.message });
    }
  }
);

/* =========================================================
   DELETE /api/posts/:postId Deletes post (only author)
========================================================= */
router.delete("/:postId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.author.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(req.params.postId);

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete post", details: err.message });
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
    res
      .status(500)
      .json({ error: "Failed to search posts", details: err.message });
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
    res
      .status(500)
      .json({ error: "Failed to fetch user posts", details: err.message });
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
    }

    // ✅ Create notification only if it's not the author's own like
    const actor = await User.findById(userId).select("name");
    await Notification.create({
      user: post.author, // receiver (post owner)
      message: `${actor?.name || "Someone"} liked your post "${post.title}"`,
      link: `/post/${post._id}`,
    });

    // After await Notification.create(...)
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    const socketId = onlineUsers.get(String(post.author));
    if (String(post.author) !== String(userId)) {
    if (socketId && io) {
      io.to(socketId).emit("notification", {
        type: "like",
        message: `${actor?.name || "Someone"} liked your post "${post.title}"`,
        link: `/post/${post._id}`,
      });
    }}

    await post.save();

    const liked = post.likes.some((id) => id.toString() === userId);
    res.json({ likesCount: post.likes.length, liked });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to like/unlike post", details: err.message });
  }
});

/* =========================================================
   POST /api/posts/:postId/comment
========================================================= */
router.post("/:postId/comment", authMiddleware, async (req, res) => {
  try {
    console.log("🔹 Comment API triggered by user:", req.user); // <-- log req.user
    const { text } = req.body;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.comments.push({ user: req.user.id, text: String(text).trim() });
    await post.save();

    const actor = await User.findById(req.user.id).select("name");
    console.log("🔹 Actor fetched:", actor); // <-- log user details
// Notify post author only if the commenter is NOT the author
if (String(req.user.id) !== String(post.author)) {
  const notification = await Notification.create({
    user: post.author,
    message: `${actor?.name || "Someone"} commented on your post "${post.title}"`,
    link: `/post/${post._id}`,
  });

  const io = req.app.get("io");
  const onlineUsers = req.app.get("onlineUsers");
  const socketId = onlineUsers.get(String(post.author));

  if (socketId && io) {
    io.to(socketId).emit("notification", { type: "comment", notification });
  }
}

    const updatedPost = await Post.findById(post._id)
      .populate("author", "name")
      .populate("comments.user", "name");

    // Broadcast the updated post to all connected clients if socket.io is available
    const io = req.app.get("io");
    if (io) {
      io.emit("postUpdated", updatedPost);
    }

    res.json(post.comments);
  } catch (err) {
    console.error("❌ Error in comment route:", err);
    res
      .status(500)
      .json({ error: "Failed to add comment", details: err.message });
  }
});

/* =========================================================
   DELETE /api/posts/:postId/comment/:commentId
========================================================= */
router.delete(
  "/:postId/comment/:commentId",
  authMiddleware,
  async (req, res) => {
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
        return res
          .status(403)
          .json({ error: "Not allowed to delete this comment" });
      }

      await post.save();
      res.json(post.comments);
    } catch (err) {
      res
        .status(500)
        .json({ error: "Failed to delete comment", details: err.message });
    }
  }
);

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
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
