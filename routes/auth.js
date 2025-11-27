const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendOTP = require("../utils/sendOTP");
const { sendForgotOtp, verifyForgotOtp, resetPassword } = require("../controllers/forgotController");
const router = express.Router();

/* -------------------- SIGNUP WITH OTP -------------------- */
router.post("/signup", async (req, res) => {
  const { name, course, specialization, semester, jluid, email, password } = req.body;

  try {
    // Check for existing email only
    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ error: "Email already registered" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with all fields
    const user = new User({
      name,
      course,
      specialization,
      semester,
      jluid, // just store it
      email,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000, // 10 mins validity
    });

    await user.save();

    // Send OTP email
    try {
      await sendOTP(email, otp);
      console.log(`✅ OTP sent to ${email}`);
      
      res.json({
        message: "Signup successful. Please verify OTP sent to your email.",
        userId: user._id,
      });
    } catch (emailError) {
      // If email fails, still allow user to continue but log the error
      console.error('❌ Failed to send OTP email:', emailError.message);
      
      // Delete the user since they can't verify without OTP
      await User.findByIdAndDelete(user._id);
      
      return res.status(500).json({ 
        error: 'Failed to send verification email. Please check your email address and try again.',
        details: emailError.message
      });
    }
  } catch (err) {
    console.error('❌ Signup error:', err);
    res.status(500).json({ error: err.message || 'Signup failed' });
  }
});

/* -------------------- VERIFY OTP -------------------- */
router.post("/verify-otp", async (req, res) => {
  const { userId, otp } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ error: "User already verified" });
    if (user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
    if (Date.now() > user.otpExpiry)
      return res.status(400).json({ error: "OTP expired" });

    // Mark user verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Generate JWT
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "OTP verified successfully!",
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        jluid: user.jluid,
        course: user.course,
        specialization: user.specialization,
        semester: user.semester,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- LOGIN -------------------- */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
    if (!user.isVerified)
      return res.status(400).json({ error: "Please verify your account first" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    // Generate JWT
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        jluid: user.jluid,
        course: user.course,
        specialization: user.specialization,
        semester: user.semester,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- LOGOUT -------------------- */
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});


router.post("/send-forgot-otp", sendForgotOtp);
router.post("/verify-forgot-otp", verifyForgotOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
