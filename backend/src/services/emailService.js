const nodemailer = require('nodemailer');

const port = Number(process.env.EMAIL_PORT) || 2525;
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: port,
  secure: port === 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const fromEmail = process.env.EMAIL_FROM || 'noreply@clinic.com';
    const isBrevo = process.env.EMAIL_HOST && process.env.EMAIL_HOST.includes('brevo');

    // Render's free tier blocks outgoing SMTP (ports 25, 465, 587).
    // If using Brevo, we bypass this by using their HTTPS REST API.
    if (isBrevo) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.EMAIL_PASSWORD,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { email: fromEmail, name: 'Healthcare Clinic' },
          to: [{ email: to }],
          subject: subject,
          textContent: text,
          htmlContent: html || text
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`Brevo API Error: ${JSON.stringify(errData)}`);
      }
      return await response.json();
    }

    // Fallback to standard SMTP for local dev / Mailtrap / Paid instances
    const info = await transporter.sendMail({
      from: `Healthcare Clinic <${fromEmail}>`,
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
