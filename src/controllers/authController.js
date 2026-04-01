const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const logger = require('../logger');

const signToken = (user) =>
  jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      logger.warn('Register failed: username or email taken', { username, email });
      return res.status(409).json({ message: 'Username or email already taken' });
    }
    const user = await User.create({ username, email, password });
    const token = signToken(user);
    logger.info('User registered', { username, email });
    res.status(201).json({ token, user });
  } catch (err) {
    logger.error('Register error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      logger.warn('Login failed: invalid credentials', { email });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = signToken(user);
    logger.info('User logged in', { username: user.username, email });
    res.json({ token, user });
  } catch (err) {
    logger.error('Login error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};
