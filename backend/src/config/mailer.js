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

const sendWelcomeEmail = async (to, name) => {
  try {
    validateEmailConfig();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Welcome to HealthMandala',
      html: `
        <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
          <h2 style="color:#00a896;margin-bottom:8px;">HealthMandala</h2>
          <h3 style="color:#1e293b;">Welcome, ${name || 'there'}!</h3>
          <p style="color:#475569;line-height:1.6;">Your HealthMandala account is ready.</p>
        </div>
      `,
    });

    console.log(`✅ Welcome email accepted for ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', {
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

const sendHospitalInviteEmail = async (to, adminName, hospitalName, setPasswordUrl) => {
  try {
    validateEmailConfig();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `Set up your ${hospitalName} admin account`,
      html: `
        <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f0fdfa;border-radius:12px;">
          <h2 style="color:#00a896;margin-bottom:8px;">HealthMandala</h2>
          <h3 style="color:#1e293b;">Hi ${adminName || 'Admin'}, set your hospital admin password</h3>
          <p style="color:#475569;line-height:1.6;">Your hospital partner account for <strong>${hospitalName}</strong> has been approved. Use the button below to create your password and access the hospital dashboard.</p>
          <p style="text-align:center;margin:28px 0;">
            <a href="${setPasswordUrl}" style="display:inline-block;background:#00a896;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;">Set Your Password</a>
          </p>
          <p style="color:#64748b;font-size:13px;line-height:1.6;">This link expires in 48 hours. If the button does not work, copy and paste this URL into your browser:</p>
          <p style="word-break:break-all;color:#0f766e;font-size:13px;">${setPasswordUrl}</p>
        </div>
      `,
    });

    console.log(`✅ Hospital invite email accepted for ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Failed to send hospital invite email:', {
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

const sendDoctorInviteEmail = async (to, doctorName, hospitalName, setPasswordUrl) => {
  try {
    validateEmailConfig();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `${hospitalName} invited you to HealthMandala`,
      html: `
        <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f0fdfa;border-radius:12px;">
          <h2 style="color:#00a896;margin-bottom:8px;">HealthMandala</h2>
          <h3 style="color:#1e293b;">Hi Dr. ${doctorName}, set your password</h3>
          <p style="color:#475569;line-height:1.6;"><strong>${hospitalName}</strong> has added you as a doctor on HealthMandala. Use the button below to create your password and access your doctor dashboard.</p>
          <p style="text-align:center;margin:28px 0;">
            <a href="${setPasswordUrl}" style="display:inline-block;background:#00a896;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;">Set Your Password</a>
          </p>
          <p style="color:#64748b;font-size:13px;line-height:1.6;">This link expires in 48 hours. If the button does not work, copy and paste this URL into your browser:</p>
          <p style="word-break:break-all;color:#0f766e;font-size:13px;">${setPasswordUrl}</p>
        </div>
      `,
    });

    console.log(`✅ Doctor invite email accepted for ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Failed to send doctor invite email:', {
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

const sendStaffInviteEmail = async (to, staffName, hospitalName, role, setPasswordUrl) => {
  try {
    validateEmailConfig();

    const roleLabel = role ? role.replace(/_/g, ' ') : 'staff';
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `${hospitalName} invited you to HealthMandala`,
      html: `
        <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f0fdfa;border-radius:12px;">
          <h2 style="color:#00a896;margin-bottom:8px;">HealthMandala</h2>
          <h3 style="color:#1e293b;">Hi ${staffName || 'there'}, set your password</h3>
          <p style="color:#475569;line-height:1.6;"><strong>${hospitalName}</strong> has added you as ${roleLabel} staff on HealthMandala. Use the button below to create your password and access your dashboard.</p>
          <p style="text-align:center;margin:28px 0;">
            <a href="${setPasswordUrl}" style="display:inline-block;background:#00a896;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;">Set Your Password</a>
          </p>
          <p style="color:#64748b;font-size:13px;line-height:1.6;">This link expires in 48 hours. If the button does not work, copy and paste this URL into your browser:</p>
          <p style="word-break:break-all;color:#0f766e;font-size:13px;">${setPasswordUrl}</p>
        </div>
      `,
    });

    console.log(`✅ Staff invite email accepted for ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Failed to send staff invite email:', {
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

const sendPasswordResetEmail = async (to, name, otp) => {
  try {
    validateEmailConfig();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Reset your HealthMandala password',
      html: `
        <div style="font-family:Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f0fdfa;border-radius:12px;">
          <h2 style="color:#00a896;margin-bottom:8px;">HealthMandala</h2>
          <h3 style="color:#1e293b;">Hi ${name}, reset your password</h3>
          <p style="color:#475569;line-height:1.6;">Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
          <div style="font-size:2.5rem;font-weight:800;letter-spacing:0.3em;color:#00a896;text-align:center;padding:24px;background:#fff;border-radius:12px;margin:24px 0;border:2px solid #e0f5f2;">${otp}</div>
          <p style="color:#94a3b8;font-size:13px;">If you didn't request a password reset, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
          <p style="color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} HealthMandala. All rights reserved.</p>
        </div>
      `,
    });
    console.log(`✅ Password reset email sent to ${to}`);
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error.message);
    throw error;
  }
};

module.exports = { transporter, sendEmailOTP, sendWelcomeEmail, sendHospitalInviteEmail, sendDoctorInviteEmail, sendStaffInviteEmail, sendPasswordResetEmail };
