const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../config/logger');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }
  return transporter;
};

const sendVerificationEmail = async (to, code) => {
  try {
    const mail = getTransporter();
    await mail.sendMail({
      from: `"Tmzon" <${config.smtp.from}>`,
      to,
      subject: 'Email Doğrulama - Tmzon',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px;">
          <h2>Email Doğrulama</h2>
          <p>Doğrulama kodunuz:</p>
          <h1 style="letter-spacing:4px;text-align:center;color:#4F46E5;">${code}</h1>
          <p>Bu kod 10 dakika içinde geçerliliğini yitirecektir.</p>
        </div>
      `,
    });
    logger.info('Verification email sent', { to });
  } catch (err) {
    logger.error('Email send error', { error: err.message, to });
    throw new Error('Email gönderilemedi');
  }
};

const sendPasswordResetEmail = async (to, code) => {
  try {
    const mail = getTransporter();
    await mail.sendMail({
      from: `"Tmzon" <${config.smtp.from}>`,
      to,
      subject: 'Şifre Sıfırlama - Tmzon',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px;">
          <h2>Şifre Sıfırlama</h2>
          <p>Şifre sıfırlama kodunuz:</p>
          <h1 style="letter-spacing:4px;text-align:center;color:#4F46E5;">${code}</h1>
          <p>Bu kod 10 dakika içinde geçerliliğini yitirecektir.</p>
        </div>
      `,
    });
    logger.info('Password reset email sent', { to });
  } catch (err) {
    logger.error('Password reset email error', { error: err.message, to });
    throw new Error('Email gönderilemedi');
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
