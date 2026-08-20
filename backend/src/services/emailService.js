const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: process.env.EMAIL_PORT || 2525,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Healthcare Clinic" <noreply@clinic.com>',
      to,
      subject,
      text,
      html,
    });
    return info;
  } catch (error) {
    console.error('Email Sending Error:', error);
    throw error;
  }
};

module.exports = { sendEmail };
