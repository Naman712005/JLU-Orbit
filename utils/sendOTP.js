// utils/sendOTP.js - Brevo (Sendinblue) implementation using @getbrevo/brevo
const Brevo = require('@getbrevo/brevo');

// Lazily-initialized Brevo transactional email API client
let brevoClient = null;

function getBrevoClient() {
  if (!process.env.BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY not configured. Set it in your environment variables.');
    throw new Error('Email service not configured');
  }

  if (!brevoClient) {
    brevoClient = new Brevo.TransactionalEmailsApi();
    const apiKey = brevoClient.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
  }

  return brevoClient;
}

async function sendOTP(email, otp) {
  try {
    const apiInstance = getBrevoClient();

    const senderEmail = process.env.BREVO_FROM_EMAIL || process.env.EMAIL_USER;
    const senderName = process.env.BREVO_FROM_NAME || 'FastConnect';

    if (!senderEmail) {
      console.error('❌ BREVO_FROM_EMAIL (or fallback EMAIL_USER) not configured.');
      throw new Error('Email sender address not configured');
    }

    // Build Brevo transactional email payload
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: senderEmail, name: senderName };
    sendSmtpEmail.to = [{ email }];
    sendSmtpEmail.subject = 'Your FastConnect OTP - Verify Your Account';
    sendSmtpEmail.textContent = `Welcome to FastConnect!\n\nYour OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0891b2;">Welcome to FastConnect!</h2>
        <p>Your OTP for account verification is:</p>
        <div style="background: #f0f9ff; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #0891b2; letter-spacing: 5px; border-radius: 8px;">
          ${otp}
        </div>
        <p style="color: #666; margin-top: 20px;">This OTP will expire in 10 minutes.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
      </div>
    `;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ OTP email sent via Brevo:', data?.messageId || data?.message || '', 'to:', email);
    return data;
  } catch (error) {
    console.error('❌ Error sending OTP email via Brevo:', error?.message || error);
    throw new Error(`Failed to send OTP email: ${error?.message || error}`);
  }
}

module.exports = sendOTP;
