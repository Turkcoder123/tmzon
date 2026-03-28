const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  register,
  login,
  verifyEmail,
  googleAuth,
  sendPhoneCode,
  verifyPhone,
  getMe,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/google', googleAuth);
router.post('/phone/send-code', sendPhoneCode);
router.post('/phone/verify', verifyPhone);
router.get('/me', auth, getMe);

module.exports = router;
