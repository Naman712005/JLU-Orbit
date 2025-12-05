const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Research = require('../models/research');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Dedicated storage for research attachments (allows images, PDFs, docs, etc.)
const researchStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'research');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploadAttachments = multer({
  storage: researchStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

/* =========================================================
   GET /api/research
   Public — loads all research posts
========================================================= */
router.get('/', async (req, res) => {
  try {
    const research = await Research.find()
      .populate('author', 'name')
      .sort({ createdAt: -1 });
    res.json(research);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to load research posts', details: err.message });
  }
});

/* =========================================================
   POST /api/research
   Protected — create new research
========================================================= */
router.post('/', authMiddleware, uploadAttachments.array('attachments', 6), async (req, res) => {
  try {
    const { title, abstract, content, keywords, confirmOriginal } = req.body;

    if (!title || !abstract || !content)
      return res
        .status(400)
        .json({ error: 'Title, abstract, and content are required' });

    if (!confirmOriginal)
      return res.status(400).json({ error: 'You must confirm originality' });

    const normalizedKeywords = Array.isArray(keywords)
      ? keywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean)
      : String(keywords || '')
          .split(',')
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean);

    const attachments = (req.files || []).map((file) => ({
      url: `/uploads/research/${file.filename}`,
      filename: file.originalname,
      mimetype: file.mimetype,
    }));

    const research = await Research.create({
      author: req.user.id,
      title,
      abstract,
      content,
      keywords: normalizedKeywords,
      confirmOriginal: true,
      attachments,
    });

    const populated = await Research.findById(research._id).populate(
      'author',
      'name'
    );
    res.status(201).json(populated);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to create research', details: err.message });
  }
});

/* =========================================================
   PUT /api/research/:id
   Protected — update own research post
========================================================= */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const research = await Research.findById(req.params.id);
    if (!research)
      return res.status(404).json({ error: 'Research post not found' });

    if (research.author.toString() !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized' });

    const { title, abstract, content, keywords } = req.body;
    if (title) research.title = title;
    if (abstract) research.abstract = abstract;
    if (content) research.content = content;
    if (keywords)
      research.keywords = Array.isArray(keywords)
        ? keywords
        : String(keywords)
            .split(',')
            .map((k) => k.trim().toLowerCase());

    await research.save();
    const updated = await Research.findById(req.params.id).populate(
      'author',
      'name'
    );
    res.json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to update research', details: err.message });
  }
});

/* =========================================================
   DELETE /api/research/:id
   Protected — delete own research post
========================================================= */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const research = await Research.findById(req.params.id);
    if (!research)
      return res.status(404).json({ error: 'Research post not found' });

    if (research.author.toString() !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized' });

    await research.deleteOne();
    res.json({ message: 'Research deleted successfully' });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to delete research', details: err.message });
  }
});

/* =========================================================
   GET /api/research/my-research
   Protected — fetch user’s own research posts
========================================================= */
router.get('/my-research', authMiddleware, async (req, res) => {
  try {
    const research = await Research.find({ author: req.user.id })
      .populate('author', 'name')
      .sort({ createdAt: -1 });
    res.json(research);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to fetch your research', details: err.message });
  }
});

module.exports = router;
