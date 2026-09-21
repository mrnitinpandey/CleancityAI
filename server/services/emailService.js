import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || 'np9257145@gmail.com';
// Normalize password by stripping spaces if present
const SMTP_PASS = (process.env.SMTP_PASS || 'skqc zwkv xemm iybz').replace(/\s+/g, '');
const SMTP_FROM = process.env.SMTP_FROM || `"CleanCity AI" <${SMTP_USER}>`;

// Create reusable transporter
export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for 587 (STARTTLS)
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * In-memory OTP Store: target (email/phone) -> { otp, expiresAt, verified }
 */
export const otpStore = new Map();

/**
 * Generate 6-digit OTP code
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP Verification Email
 */
export async function sendOTPEmail(toEmail, otpCode, purpose = 'Account Registration') {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d1322; color: #e2e8f0; margin: 0; padding: 20px; }
        .container { max-width: 540px; margin: 0 auto; background: #131b2e; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .brand { text-align: center; margin-bottom: 24px; }
        .brand-title { color: #10b981; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
        .brand-sub { color: #94a3b8; font-size: 13px; margin-top: 4px; }
        .content-box { background: #0b1120; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0; }
        .otp-code { font-family: 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #34d399; margin: 16px 0; }
        .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">
          <h1 class="brand-title">🌱 CleanCity AI</h1>
          <div class="brand-sub">Civic Cleanliness & Municipal Action Platform</div>
        </div>
        <p style="font-size: 15px; color: #cbd5e1; line-height: 1.5;">
          Hello,
        </p>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">
          Your one-time verification code for <strong>${purpose}</strong> is:
        </p>
        <div class="content-box">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">One-Time Password (OTP)</div>
          <div class="otp-code">${otpCode}</div>
          <div style="font-size: 12px; color: #fbbf24;">⏱️ Valid for 10 minutes. Do not share this code with anyone.</div>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">
          If you did not request this verification code, please disregard this email.
        </p>
        <div class="footer">
          CleanCity AI Municipal Network • Kanpur Smart City Initiative<br/>
          Secure Automated Verification Service
        </div>
      </div>
    </body>
    </html>
  `;

  return await transporter.sendMail({
    from: SMTP_FROM,
    to: toEmail,
    subject: `🔐 CleanCity AI Verification OTP: ${otpCode}`,
    text: `Your CleanCity AI verification code is: ${otpCode}. It is valid for 10 minutes.`,
    html: htmlTemplate
  });
}

/**
 * Send Security Alert Email on User Login
 */
export async function sendLoginAlertEmail(toEmail, { userName, role, timestamp, ip }) {
  const formattedTime = timestamp ? new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d1322; color: #e2e8f0; margin: 0; padding: 20px; }
        .container { max-width: 540px; margin: 0 auto; background: #131b2e; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .brand { text-align: center; margin-bottom: 24px; }
        .brand-title { color: #10b981; font-size: 24px; font-weight: 800; margin: 0; }
        .badge { display: inline-block; background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-top: 8px; }
        .detail-card { background: #0b1120; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
        .detail-row:last-child { border-bottom: none; }
        .label { color: #64748b; }
        .value { color: #f1f5f9; font-weight: 600; text-align: right; }
        .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">
          <h1 class="brand-title">🌱 CleanCity AI</h1>
          <div class="badge">🛡️ Account Login Notification</div>
        </div>
        <p style="font-size: 15px; color: #cbd5e1; line-height: 1.5;">
          Hello <strong>${userName || 'User'}</strong>,
        </p>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">
          A new sign-in was detected for your CleanCity AI account:
        </p>
        <div class="detail-card">
          <div class="detail-row">
            <span class="label">Account Email</span>
            <span class="value">${toEmail}</span>
          </div>
          <div class="detail-row">
            <span class="label">User Role</span>
            <span class="value" style="text-transform: uppercase; color: #34d399;">${role || 'Citizen'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Time (IST)</span>
            <span class="value">${formattedTime}</span>
          </div>
          <div class="detail-row">
            <span class="label">Status</span>
            <span class="value" style="color: #10b981;">✓ Authenticated</span>
          </div>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">
          If this was you, you can safely ignore this email. If you did not sign in recently, please secure your account credentials immediately.
        </p>
        <div class="footer">
          CleanCity AI Security Team • Kanpur Municipal Smart City Portal
        </div>
      </div>
    </body>
    </html>
  `;

  return await transporter.sendMail({
    from: SMTP_FROM,
    to: toEmail,
    subject: `🔔 New Login Alert: CleanCity AI Account (${role?.toUpperCase() || 'USER'})`,
    text: `New login to CleanCity AI for ${toEmail} as ${role} at ${formattedTime}.`,
    html: htmlTemplate
  });
}
