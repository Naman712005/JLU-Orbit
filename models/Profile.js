const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Link to your existing User model
    required: true,
    unique: true
  },
  username: { type: String, required: true },
  bio: { type: String, default: 'Student | Enthusiast' },
  profileImage: { type: String }, // Stores base64 string or image URL
  // Optional extended contact + network fields
  phone: { type: String },
  location: { type: String },
  linkedin: { type: String },
  github: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
