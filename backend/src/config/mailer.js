const nodemailer = require('nodemailer');

const requiredEmailEnv = ['EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
const emailHost = process.env.EMAIL_HOST || 'smtp-relay.brevo.com';
const emailPort = Number(process.env.EMAIL_PORT || 2525);
const emailSecure = process.env.EMAIL_SECURE
  ? process.env.EMAIL_SECURE === 'true'
  : emailPort === 465;

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: emailSecure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

const validateEmailConfig = () => {
  const missing = requiredEmailEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing email configuration: ${missing.join(', ')}. Configure these environment variables in Render using Brevo SMTP credentials.`);
  }

  if (!Number.isInteger(emailPort) || emailPort <= 0) {
    throw new Error('Invalid email configuration: EMAIL_PORT must be a valid port number.');
  }
};

// Send 6-digit OTP to email
const sendEmailOTP = async (to, name, otp) => {
  try {
    validateEmailConfig();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Your HealthMandala verification code',
      html: `
        <div style="font-family:Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f0fdfa;border-radius:12px;">
          <h2 style="color:#00a896;margin-bottom:8px;">HealthMandala</h2>
          <h3 style="color:#1e293b;">Hi ${name}, here's your verification code</h3>
          <p style="color:#475569;line-height:1.6;">Use this code to verify your email address. It expires in <strong>1 minute</strong>.</p>
          <div style="font-size:2.5rem;font-weight:800;letter-spacing:0.3em;color:#00a896;text-align:center;padding:24px;background:#fff;border-radius:12px;margin:24px 0;border:2px solid #e0f5f2;">${otp}</div>
          <p style="color:#94a3b8;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
          <p style="color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} HealthMandala. All rights reserved.</p>
        </div>
      `,
    });
    console.log(`✅ OTP email sent successfully to ${to}`);
  } catch (error) {
    console.error('❌ Failed to send OTP email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      emailHost,
      emailPort,
      emailSecure
    });
    throw error;
  }
};

// ... (keep the rest of your functions as they are)

const sendWelcomeEmail = async (to, name) => {
  // (keep your existing sendWelcomeEmail function)
};

const sendHospitalInviteEmail = async (to, adminName, hospitalName, setPasswordUrl) => {
  // (keep existing)
};

const sendDoctorInviteEmail = async (to, doctorName, hospitalName, setPasswordUrl) => {
  // (keep existing)
};

const sendStaffInviteEmail = async (to, staffName, hospitalName, role, setPasswordUrl) => {
  // (keep existing)
};

module.exports = { transporter, sendEmailOTP, sendWelcomeEmail, sendHospitalInviteEmail, sendDoctorInviteEmail, sendStaffInviteEmail };
