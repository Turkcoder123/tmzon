const nodemailer = require('nodemailer');
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = require('../config/env');
const logger = require('../logger');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (!SMTP_HOST || !SMTP_USER) {
    logger.warn('SMTP not configured – emails will be logged only');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

/**
 * Send an email. Falls back to logging in dev/when SMTP is not configured.
 */
async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    logger.info('Email (not sent – no SMTP)', { to, subject, text: text && text.substring(0, 200) });
    return null;
  }
  const info = await t.sendMail({ from: SMTP_FROM, to, subject, text, html });
  logger.info('Email sent', { to, subject, messageId: info.messageId });
  return info;
}

/**
 * Send a 6-digit email verification code.
 */
async function sendVerificationCode(email, code) {
  return sendEmail({
    to: email,
    subject: 'tmzon – Email Doğrulama Kodu',
    text: `Doğrulama kodunuz: ${code}\n\nBu kod 15 dakika geçerlidir.`,
    html: `<h2>Email Doğrulama</h2><p>Doğrulama kodunuz: <strong>${code}</strong></p><p>Bu kod 15 dakika geçerlidir.</p>`,
  });
}

/**
 * Send a password reset email.
 */
async function sendPasswordResetEmail(email, resetUrl) {
  return sendEmail({
    to: email,
    subject: 'tmzon – Şifre Sıfırlama',
    text: `Şifrenizi sıfırlamak için bu linke tıklayın: ${resetUrl}\n\nBu link 15 dakika geçerlidir. Eğer bu isteği siz yapmadıysanız, bu emaili görmezden gelin.`,
    html: `<h2>Şifre Sıfırlama</h2><p><a href="${resetUrl}">Şifrenizi sıfırlamak için tıklayın</a></p><p>Bu link 15 dakika geçerlidir.</p>`,
  });
}

/**
 * Send a magic link login email.
 */
async function sendMagicLinkEmail(email, magicUrl) {
  return sendEmail({
    to: email,
    subject: 'tmzon – Giriş Linki',
    text: `Giriş yapmak için bu linke tıklayın: ${magicUrl}\n\nBu link 15 dakika geçerlidir.`,
    html: `<h2>Şifresiz Giriş</h2><p><a href="${magicUrl}">Giriş yapmak için tıklayın</a></p><p>Bu link 15 dakika geçerlidir.</p>`,
  });
}

/**
 * Send notification about new device login.
 */
async function sendNewDeviceAlert(email, deviceName, ipAddress) {
  return sendEmail({
    to: email,
    subject: 'tmzon – Yeni Cihaz Girişi',
    text: `Hesabınıza yeni bir cihazdan giriş yapıldı.\n\nCihaz: ${deviceName}\nIP: ${ipAddress}\n\nBu siz değilseniz, hesabınızı güvence altına alın.`,
    html: `<h2>Yeni Cihaz Girişi</h2><p>Cihaz: <strong>${deviceName}</strong></p><p>IP: <strong>${ipAddress}</strong></p><p>Bu siz değilseniz, hesabınızı güvence altına alın.</p>`,
  });
}

module.exports = {
  sendEmail,
  sendVerificationCode,
  sendPasswordResetEmail,
  sendMagicLinkEmail,
  sendNewDeviceAlert,
};
