
const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true }, 
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String }, 
    tags: [{ type: String }], 


    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    comments: [CommentSchema],

shares: {
    type: Number,
    default: 0
  },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", PostSchema);
