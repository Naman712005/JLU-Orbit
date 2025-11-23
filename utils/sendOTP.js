// utils/sendOTP.js - Resend-based implementation (no SMTP)
const { Resend } = require('resend');

// We create the client lazily so the app doesn't crash if the key is missing at require time
let resendClient = null;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured. Set it in your environment variables.');
    throw new Error('Email service not configured');
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

async function sendOTP(email, otp) {
  try {
    const resend = getResendClient();

    const from = process.env.RESEND_FROM || 'FastConnect <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject: 'Your FastConnect OTP - Verify Your Account',
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
      `,
    });

    if (error) {
      console.error('❌ Error sending OTP email via Resend:', error);
      throw new Error(error.message || 'Resend email send failed');
    }

    console.log('✅ OTP email sent via Resend:', data?.id, 'to:', email);
    return data;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message || error);
    throw new Error(`Failed to send OTP email: ${error.message || error}`);
  }
}

module.exports = sendOTP;
