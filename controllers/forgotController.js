// controllers/forgotController.js
const User = require("../models/User");
const sendOTP = require("../utils/sendOTP");   // <-- Your Brevo OTP Sender

// Temporary OTP storage (can be moved to DB later)
let forgotOtpStore = {};   // { email : { otp, expiresAt } }

// STEP 1: Send OTP for Forgot Password
exports.sendForgotOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "Email not registered!" });

    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save OTP with expiration (10 minutes)
    forgotOtpStore[email] = {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000
    };

    // Send OTP with Brevo
    await sendOTP(email, otp);

    res.json({ success: true, message: "OTP sent successfully!" });
  } catch (err) {
    console.error("Forgot Password OTP Error:", err);
    res.json({ success: false, message: "Failed to send OTP. Try again." });
  }
};

// STEP 2: Verify OTP
exports.verifyForgotOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!forgotOtpStore[email])
      return res.json({ success: false, message: "Request OTP again!" });

    const stored = forgotOtpStore[email];

    if (Date.now() > stored.expiresAt)
      return res.json({ success: false, message: "OTP expired! Try again." });

    if (stored.otp != otp)
      return res.json({ success: false, message: "Invalid OTP!" });

    res.json({ success: true, message: "OTP verified!" });
  } catch (err) {
    res.json({ success: false, message: "OTP verification failed!" });
  }
};

// STEP 3: Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "User not found" });

    user.password = newPassword;  // (make sure password hashing middleware exists)
    await user.save();

    // Delete OTP after use
    delete forgotOtpStore[email];

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    res.json({ success: false, message: "Password reset failed!" });
  }
};
