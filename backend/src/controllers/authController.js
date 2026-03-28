const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const config = require('../config');
const logger = require('../config/logger');
const { generateToken, generateVerificationCode } = require('../utils/token');
const { sendVerificationEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');
const redis = require('../config/redis');

const googleClient = new OAuth2Client(config.google.clientId);

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { email, password, username, displayName } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, şifre ve kullanıcı adı gerekli' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ error: 'Bu email veya kullanıcı adı zaten kullanılıyor' });
    }

    const code = generateVerificationCode();
    const user = await User.create({
      email,
      password,
      username,
      displayName: displayName || username,
      authProvider: 'email',
      verificationCode: code,
      verificationExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendVerificationEmail(email, code);

    const token = generateToken(user._id);
    res.status(201).json({
      message: 'Kayıt başarılı. Email doğrulama kodu gönderildi.',
      token,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email ve şifre gerekli' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || user.authProvider !== 'email') {
      return res.status(401).json({ error: 'Geçersiz email veya şifre' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Geçersiz email veya şifre' });
    }

    const token = generateToken(user._id);
    res.json({ token, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email }).select(
      '+verificationCode +verificationExpires'
    );
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    if (user.verificationCode !== code || user.verificationExpires < new Date()) {
      return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş doğrulama kodu' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({ message: 'Email doğrulandı' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/google
exports.googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Google ID token gerekli' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        user.authProvider = 'google';
        user.isVerified = true;
        await user.save();
      } else {
        const { v4: uuidv4 } = require('uuid');
        const username = email.split('@')[0] + '_' + uuidv4().slice(0, 8);
        user = await User.create({
          googleId,
          email,
          username,
          displayName: name,
          avatar: picture,
          authProvider: 'google',
          isVerified: true,
        });
      }
    }

    const token = generateToken(user._id);
    res.json({ token, user: user.toPublicJSON() });
  } catch (err) {
    logger.error('Google auth error', { error: err.message });
    next(err);
  }
};

// POST /api/auth/phone/send-code
exports.sendPhoneCode = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Telefon numarası gerekli' });
    }

    const code = generateVerificationCode();
    await redis.setex(`phone:${phone}`, 600, code);

    await sendSMS(phone, code);

    res.json({ message: 'Doğrulama kodu gönderildi' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/phone/verify
exports.verifyPhone = async (req, res, next) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Telefon numarası ve doğrulama kodu gerekli' });
    }

    const storedCode = await redis.get(`phone:${phone}`);
    if (!storedCode || storedCode !== code) {
      return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş doğrulama kodu' });
    }

    await redis.del(`phone:${phone}`);

    let user = await User.findOne({ phone });

    if (!user) {
      const { v4: uuidv4 } = require('uuid');
      const username = 'user_' + uuidv4().slice(0, 8);
      user = await User.create({
        phone,
        username,
        displayName: username,
        authProvider: 'phone',
        isVerified: true,
      });
    }

    const token = generateToken(user._id);
    res.json({ token, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
};
