const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmailOTP, sendPasswordResetEmail } = require('../config/mailer');
const { verifyNMCDoctor } = require('../utils/nmcVerify');

// In-memory OTP store: email → { otp, expiresAt, userData }
const emailOtpStore = new Map();

// In-memory password-reset OTP store: email → { otp, expiresAt }
const resetOtpStore = new Map();

// ── Step 1: Send OTP to email ──
router.post('/send-email-otp', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, nmcNumber, experienceYears, specialization, qualification, currentHospital } = req.body;
    if (!email || !password || !firstName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Block doctor self-registration
    if ((role || 'patient') === 'doctor') {
      return res.status(403).json({ 
        error: 'Doctor self-registration is no longer available. Please contact your hospital administrator to add you to the system.'
      });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 1 * 60 * 1000; // 1 minute

    emailOtpStore.set(email, {
      otp, expiresAt, firstName, lastName, email, password, role: role || 'patient',
      nmcNumber, experienceYears, specialization, qualification, currentHospital
    });

    await sendEmailOTP(email, firstName, otp);
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Send email OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP', message: error.message });
  }
});

// ── Step 2: Verify OTP and issue a pending registration token (no User created yet) ──
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = emailOtpStore.get(email);

    if (!record) return res.status(400).json({ error: 'No OTP found for this email. Please sign up again.' });
    if (Date.now() > record.expiresAt) {
      emailOtpStore.delete(email);
      return res.status(400).json({ error: 'OTP has expired. Please sign up again.' });
    }
    if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP. Please try again.' });

    emailOtpStore.delete(email);

    // Issue a short-lived pending token — User is NOT created yet.
    // The patient registration form will create the User + PatientRegistration atomically.
    const pendingToken = jwt.sign(
      {
        pending: true,
        firstName: record.firstName,
        lastName: record.lastName,
        email: record.email,
        password: record.password,
        role: record.role || 'patient',
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      pendingToken,
      user: {
        firstName: record.firstName,
        lastName: record.lastName,
        email: record.email,
        role: record.role || 'patient',
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed', message: error.message });
  }
});

// ── Resend OTP ──
router.post('/resend-email-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const record = emailOtpStore.get(email);
    if (!record) return res.status(400).json({ error: 'No pending signup for this email. Please sign up again.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    record.otp = otp;
    record.expiresAt = Date.now() + 1 * 60 * 1000;
    emailOtpStore.set(email, record);

    await sendEmailOTP(email, record.firstName, otp);
    res.json({ success: true, message: 'New OTP sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resend OTP', message: error.message });
  }
});

// Register with Email
router.post('/register/email', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, firebaseUid } = req.body;

    // Block doctor self-registration
    if ((role || 'patient') === 'doctor') {
      return res.status(403).json({ 
        error: 'Doctor self-registration is no longer available. Please contact your hospital administrator.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: role || 'patient',
      authMethod: 'email',
      firebaseUid,
      isEmailVerified: true,
      status: 'active'
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});

// Register with Phone — issues a pending token, User created only after patient registration form
router.post('/register/phone', async (req, res) => {
  try {
    const { firstName, lastName, phone, password, role } = req.body;

    // Block doctor self-registration
    if ((role || 'patient') === 'doctor') {
      return res.status(403).json({ 
        error: 'Doctor self-registration is no longer available. Please contact your hospital administrator.'
      });
    }

    // Check if phone already registered
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Issue a short-lived pending token — User is NOT created yet.
    const pendingToken = jwt.sign(
      {
        pending: true,
        firstName,
        lastName,
        phone,
        password,
        role: role || 'patient',
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({
      success: true,
      pendingToken,
      user: { firstName, lastName, phone, role: role || 'patient' }
    });
  } catch (error) {
    console.error('Register phone error:', error);
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Find user by email or phone
    let user;
    if (email) {
      user = await User.findOne({ email });
    } else if (phone) {
      user = await User.findOne({ phone });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Only block suspended accounts, allow pending accounts to login
    if (user.status === 'suspended') {
      return res.status(403).json({ 
        error: 'Account suspended',
        status: 'suspended'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

// Get user by ID
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user', message: error.message });
  }
});

// Update email verification status
router.put('/verify-email/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isEmailVerified: true },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update', message: error.message });
  }
});

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth' }));

// ── Change password (logged-in user) ─────────────────────────────────────────
router.put('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(400).json({ error: 'Current password is incorrect.' });

    user.password = newPassword; // pre-save hook hashes it
    await user.save();
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password.', message: error.message });
  }
});

// ── Forgot password — Step 1: send OTP ───────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always respond success to avoid email enumeration
    if (!user) return res.json({ success: true, message: 'If that email exists, a reset code has been sent.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    resetOtpStore.set(email.toLowerCase().trim(), { otp, expiresAt, userId: user._id.toString() });

    await sendPasswordResetEmail(email, user.firstName, otp);
    res.json({ success: true, message: 'Reset code sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset code.', message: error.message });
  }
});

// ── Forgot password — Step 2: verify OTP ─────────────────────────────────────
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

    const record = resetOtpStore.get(email.toLowerCase().trim());
    if (!record) return res.status(400).json({ error: 'No reset request found. Please request a new code.' });
    if (Date.now() > record.expiresAt) {
      resetOtpStore.delete(email.toLowerCase().trim());
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }
    if (record.otp !== otp) return res.status(400).json({ error: 'Invalid code. Please try again.' });

    // Issue a short-lived reset token (5 min)
    const resetToken = jwt.sign(
      { resetUserId: record.userId, email: email.toLowerCase().trim() },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );
    res.json({ success: true, resetToken });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed.', message: error.message });
  }
});

// ── Forgot password — Step 3: set new password ───────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) return res.status(400).json({ error: 'Token and new password are required.' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: 'Reset session expired. Please start over.' });
    }

    const user = await User.findById(payload.resetUserId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.password = newPassword; // pre-save hook hashes it
    await user.save();
    resetOtpStore.delete(payload.email);

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password.', message: error.message });
  }
});

module.exports = router;
