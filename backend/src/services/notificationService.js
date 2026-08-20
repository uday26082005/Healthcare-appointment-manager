const db = require('../db');
const { sendEmail } = require('./emailService');

const queueAndSendNotification = async (appointmentId, recipientId, email, type, subject, message, htmlMessage = null) => {
  const connection = await db.getConnection();
  let notificationId;
  try {
    const [res] = await connection.execute(
      'INSERT INTO notifications (appointment_id, recipient_id, notification_type, status, subject, message_body) VALUES (?, ?, ?, "PENDING", ?, ?)',
      [appointmentId, recipientId, type, subject, message]
    );
    notificationId = res.insertId;
  } catch (error) {
    console.error('Failed to insert notification record:', error);
    connection.release();
    return; // Don't crash
  }
  connection.release();

  // Attempt to send immediately
  try {
    await sendEmail({
      to: email,
      subject,
      text: message,
      html: htmlMessage,
    });
    
    await db.execute(
      'UPDATE notifications SET status = "SENT", sent_at = NOW() WHERE id = ?',
      [notificationId]
    );
  } catch (emailError) {
    await db.execute(
      'UPDATE notifications SET status = "FAILED", last_error = ? WHERE id = ?',
      [emailError.message, notificationId]
    );
  }
};

module.exports = { queueAndSendNotification };
