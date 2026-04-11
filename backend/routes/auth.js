const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User   = require('../models/User');
const OTP    = require('../models/OTP');
const { sendOTP } = require('../utils/sms');

const OTP_EXPIRY_MINUTES = 10;

// ── POST /api/auth/send-otp ────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanPhone = phone.replace(/\s/g, '').replace(/^\+?91/, '');
    if (!phone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    // Rate limit: max 3 OTPs per 10 minutes
    const recentCount = await OTP.countDocuments({
      phone,
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
    });
    if (recentCount >= 3) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Try again in 10 minutes.' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await OTP.create({ phone, otp, expiresAt });
    await sendOTP(phone, otp);

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

    const record = await OTP.findOne({ phone, verified: false })
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
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone });
    }

    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
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
    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
    const token = jwt.sign(
      { isAdmin: true, email },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

module.exports = router;
