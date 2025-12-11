const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
    unique: true
  },
  username: { type: String, required: true },
  bio: { type: String, default: 'Student | Enthusiast' },
  profileImage: { type: String }, 

  phone: { type: String },
  location: { type: String },
  linkedin: { type: String },
  github: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
