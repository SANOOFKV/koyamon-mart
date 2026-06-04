const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User   = require('../models/User');
const OTP    = require('../models/OTP');
const { sendOTP } = require('../utils/sms');
const rateLimit = require('express-rate-limit');

const OTP_EXPIRY_MINUTES = 10;

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { success: false, message: 'Too many OTP requests from this IP, please try again after 15 minutes' }
});

// ── POST /api/auth/send-otp ────────────────────────────────────────────────────
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanPhone = phone.replace(/\s/g, '').replace(/^\+?91/, '');
    if (!phone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    const normalizedPhone = '+91' + cleanPhone;

    // Rate limit: max 3 OTPs per 10 minutes
    const recentCount = await OTP.countDocuments({
      phone: normalizedPhone,
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
    });
    if (recentCount >= 3) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Try again in 10 minutes.' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await OTP.create({ phone: normalizedPhone, otp, expiresAt });
    await sendOTP(normalizedPhone, otp);

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const cleanPhone = phone.replace(/\s/g, '').replace(/^\+?91/, '');
    const normalizedPhone = '+91' + cleanPhone;

    const record = await OTP.findOne({ phone: normalizedPhone, verified: false })
      .sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP not found. Request a new one.' });
    }
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }
    if (record.attempts >= 5) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Request a new OTP.' });
    }
    if (record.otp !== otp) {
      await OTP.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
      return res.status(400).json({ success: false, message: 'Incorrect OTP' });
    }

    await OTP.updateOne({ _id: record._id }, { verified: true });

    // Find or create user
    let user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      user = await User.create({ phone: normalizedPhone });
    }

    const accessToken = jwt.sign(
      { userId: user._id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      success: true,
      token: accessToken,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        orderCount: user.orderCount,
        addresses: user.addresses,
      },
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
});

// ── POST /api/auth/admin-login ────────────────────────────────────────────────
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const accessToken = jwt.sign(
      { userId: admin._id, email: admin.email, role: 'admin', isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    admin.refreshTokens.push(refreshToken);
    await admin.save();

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ success: true, token: accessToken, message: 'Admin logged in' });
  } catch (err) {
    console.error('admin-login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// ── POST /api/auth/refresh ──────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token' });

    const user = await User.findOne({ refreshTokens: refreshToken });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const accessToken = jwt.sign(
      { userId: user._id, phone: user.phone, email: user.email, role: user.role, isAdmin: user.role === 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 15 * 60 * 1000 });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Refresh failed' });
  }
});

// ── POST /api/auth/logout ───────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await User.updateOne({ refreshTokens: refreshToken }, { $pull: { refreshTokens: refreshToken } });
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});

// ── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const { accessToken } = req.cookies;
    if (!accessToken) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
});

module.exports = router;
