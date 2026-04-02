const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/phone/send-otp', authController.sendPhoneOTPHandler);
router.post('/phone/verify-otp', authController.verifyPhoneOTPHandler);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/magic-link/send', authController.sendMagicLink);
router.post('/magic-link/verify', authController.verifyMagicLink);
router.post('/refresh', authController.refreshToken);

// Authenticated auth routes
router.post('/verify-email', auth, authController.verifyEmail);
router.post('/resend-verification', auth, authController.resendVerification);
router.post('/logout', auth, authController.logout);
router.post('/logout-all', auth, authController.logoutAll);
router.get('/sessions', auth, authController.getSessions);
router.delete('/sessions/:sessionId', auth, authController.revokeSession);
router.post('/link-provider', auth, authController.linkProvider);
router.post('/unlink-provider', auth, authController.unlinkProvider);
router.post('/change-password', auth, authController.changePassword);

module.exports = router;
