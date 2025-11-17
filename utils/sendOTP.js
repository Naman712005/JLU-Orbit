// utils/sendOTP.js
const nodemailer = require("nodemailer");

async function sendOTP(email, otp) {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in environment variables.');
      throw new Error('Email service not configured');
    }

    // Create transporter with explicit configuration
    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });

    // Verify transporter configuration
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');

    let mailOptions = {
      from: `"FastConnect" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your FastConnect OTP - Verify Your Account",
      text: `Welcome to FastConnect!\n\nYour OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2;">Welcome to FastConnect!</h2>
          <p>Your OTP for account verification is:</p>
          <div style="background: #f0f9ff; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #0891b2; letter-spacing: 5px; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #666; margin-top: 20px;">This OTP will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully:', info.messageId);
    console.log('📧 Sent to:', email);
    return info;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    
    // Provide specific error messages
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Check your Gmail App Password.');
    } else if (error.code === 'ESOCKET') {
      throw new Error('Cannot connect to email server. Check your internet connection.');
    } else {
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  }
}

module.exports = sendOTP;
