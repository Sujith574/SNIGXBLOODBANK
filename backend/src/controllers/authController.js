const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendMail } = require('../config/email');
const asyncHandler = require('../config/asyncHandler');
const User = require('../models/User');
const { signAccessToken } = require('../services/tokenService');

function passwordMeetsRules(password) {
  const rules = [
    /^.{8,}$/.test(password),
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  return rules.every(Boolean);
}

function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function sendEmailVerification(user) {
  const rawToken = makeToken();
  const tokenHash = hashToken(rawToken);

  user.emailVerificationToken = tokenHash;
  user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  const verifyLink = `${process.env.APP_BASE_URL || process.env.CLIENT_URL}/verify-email?token=${rawToken}`;

  await sendMail({
    to: user.email,
    subject: 'Verify your email - Snigx Blood Bank',
    text: `Click to verify: ${verifyLink}`,
    html: `<p>Click to verify your email:</p><a href="${verifyLink}">Verify Email</a>`,
  });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required', data: null, statusCode: 400 });
  }

  if (!passwordMeetsRules(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 chars and include uppercase, lowercase, number, and special character',
      data: null,
      statusCode: 400,
    });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already in use', data: null, statusCode: 409 });
  }

  const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS || 10));

  const shouldAutoVerify = !process.env.EMAIL_HOST || process.env.EMAIL_HOST === 'replace_me' || process.env.NODE_ENV === 'development';

  const user = await User.create({
    name: name || undefined,
    email: email.toLowerCase().trim(),
    passwordHash,
    role: role && ['admin', 'bloodbank', 'hospital'].includes(role) ? role : 'bloodbank',
    isEmailVerified: shouldAutoVerify ? true : false,
  });

  if (!shouldAutoVerify) {
    try {
      await sendEmailVerification(user);
    } catch (err) {
      console.error('Failed to send verification email, but user was created:', err);
    }
  }

  return res.status(201).json({
    success: true,
    message: shouldAutoVerify 
      ? 'Registration successful. Account automatically verified.' 
      : 'Registration successful. Please verify your email.',
    data: { userId: user._id },
    statusCode: 201,
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required', data: null, statusCode: 400 });
  }

  const tokenHash = hashToken(token);
  const user = await User.findOne({ emailVerificationToken: tokenHash });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid verification token', data: null, statusCode: 400 });
  }

  if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ success: false, message: 'Verification token expired', data: null, statusCode: 400 });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();

  return res.status(200).json({ success: true, message: 'Email verified successfully', data: null, statusCode: 200 });
});

const login = asyncHandler(async (req, res) => {
  const { email, password, remember } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required', data: null, statusCode: 400 });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials', data: null, statusCode: 401 });
  }

  if (user.isSuspended) {
    return res.status(403).json({ success: false, message: 'Account suspended', data: null, statusCode: 403 });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({ success: false, message: 'Please verify your email first', data: null, statusCode: 403 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ success: false, message: 'Invalid credentials', data: null, statusCode: 401 });
  }

  const accessToken = signAccessToken({ userId: user._id, role: user.role });

  if (remember) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });
  }

  user.lastLoginAt = new Date();
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken,
      user: { id: user._id, role: user.role, email: user.email, name: user.name },
    },
    statusCode: 200,
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('accessToken');
  return res.status(200).json({ success: true, message: 'Logged out', data: null, statusCode: 200 });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ success: false, message: 'Email is required', data: null, statusCode: 400 });

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    return res.status(200).json({ success: true, message: 'If the account exists, you will receive a reset email', data: null, statusCode: 200 });
  }

  const rawToken = makeToken();
  user.passwordResetTokenHash = hashToken(rawToken);
  user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const resetLink = `${process.env.APP_BASE_URL || process.env.CLIENT_URL}/reset-password?token=${rawToken}`;

  await sendMail({
    to: user.email,
    subject: 'Reset your password - Snigx Blood Bank',
    text: `Reset link: ${resetLink}`,
    html: `<p>Reset your password:</p><a href="${resetLink}">Reset Password</a>`,
  });

  return res.status(200).json({ success: true, message: 'Password reset email sent', data: null, statusCode: 200 });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body || {};

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and newPassword are required', data: null, statusCode: 400 });
  }

  if (!passwordMeetsRules(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 chars and include uppercase, lowercase, number, and special character',
      data: null,
      statusCode: 400,
    });
  }

  const tokenHash = hashToken(token);
  const user = await User.findOne({ passwordResetTokenHash: tokenHash });

  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token', data: null, statusCode: 400 });
  }

  user.passwordHash = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_SALT_ROUNDS || 10));
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  return res.status(200).json({ success: true, message: 'Password reset successfully', data: null, statusCode: 200 });
});

module.exports = { register, verifyEmail, login, logout, forgotPassword, resetPassword };

