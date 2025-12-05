const mongoose = require('mongoose');

const researchSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  abstract: { type: String, required: true },
  content: { type: String, required: true },
  keywords: [{ type: String }],
  confirmOriginal: { type: Boolean, default: false },
  attachments: [
    {
      url: { type: String },
      filename: { type: String },
      mimetype: { type: String },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Research', researchSchema);
