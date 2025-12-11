const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Profile = require("../models/Profile");

const router = express.Router();

/* ---------------- Middleware: Verify JWT ---------------- */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid token" });
  }
}

/* ---------------- GET: Fetch logged-in user profile ---------------- */
router.get("/", authMiddleware, async (req, res) => {
  try {
    // 1️⃣ Fetch user basic info
    const user = await User.findById(req.user.id).select(
      "-password -otp -otpExpiry"
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2️⃣ Fetch or create profile for this user
    let profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await Profile.create({
        userId: req.user.id,
        username: user.name,
        bio: "Student | Enthusiast",
        profileImage: "",
      });
    }

    // 3️⃣ Combine both data sets
    const mergedProfile = {
      id: user._id,
      name: user.name,
      jluid: user.jluid,
      email: user.email,
      course: user.course,
      specialization: user.specialization,
      semester: user.semester,
      bio: profile.bio,
      profileImage: profile.profileImage,
      phone: profile.phone || "",
      location: profile.location || "",
      linkedin: profile.linkedin || "",
      github: profile.github || "",
    };

    res.status(200).json({ success: true, profile: mergedProfile });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------- POST: Update logged-in user profile ---------------- */
router.post("/update", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      bio,
      profileImage,
      course,
      specialization,
      semester,
      phone,
      location,
      linkedin,
      github,
    } = req.body;

    // 1️⃣ Update user info (if any)
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(name && { name }),
        ...(course && { course }),
        ...(specialization && { specialization }),
        ...(semester && { semester }),
      },
      { new: true }
    ).select("-password -otp -otpExpiry");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2️⃣ Update or create profile info
    let updatedProfile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      {
        username: updatedUser.name,
        ...(bio && { bio }),
        ...(profileImage && { profileImage }),
        ...(phone !== undefined && { phone }),
        ...(location !== undefined && { location }),
        ...(linkedin !== undefined && { linkedin }),
        ...(github !== undefined && { github }),
      },
      { new: true, upsert: true } 
    );

    // 3️⃣ Merge updated data
    const mergedProfile = {
      id: updatedUser._id,
      name: updatedUser.name,
      jluid: updatedUser.jluid,
      email: updatedUser.email,
      course: updatedUser.course,
      specialization: updatedUser.specialization,
      semester: updatedUser.semester,
      bio: updatedProfile.bio,
      profileImage: updatedProfile.profileImage,
      phone: updatedProfile.phone || "",
      location: updatedProfile.location || "",
      linkedin: updatedProfile.linkedin || "",
      github: updatedProfile.github || "",
    };

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile: mergedProfile,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
