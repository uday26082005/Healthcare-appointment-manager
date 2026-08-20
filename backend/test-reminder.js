require('dotenv').config();
const db = require('./src/db');
const { sendEmail } = require('./src/services/emailService');

async function testReminders() {
  const connection = await db.getConnection();
  const [appointments] = await connection.execute("SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.start_time, p.email as patient_email, p.name as patient_name, d_user.id as doctor_user_id, d_user.email as doctor_email, d_user.name as doctor_name FROM appointments a JOIN users p ON a.patient_id = p.id JOIN doctors d ON a.doctor_id = d.id JOIN users d_user ON d.user_id = d_user.id WHERE a.status = 'BOOKED' AND CONCAT(a.appointment_date, ' ', a.start_time) BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)");

  for (const appt of appointments) {
    const [pNotif] = await connection.execute('SELECT id FROM notifications WHERE appointment_id = ? AND recipient_id = ? AND notification_type = "REMINDER"', [appt.id, appt.patient_id]);
    if (pNotif.length === 0) {
      await connection.execute('INSERT INTO notifications (appointment_id, recipient_id, notification_type, status, subject, message_body) VALUES (?, ?, "REMINDER", "PENDING", ?, ?)', [appt.id, appt.patient_id, 'Upcoming Appointment Reminder', 'Patient Reminder Body']);
    }
    const [dNotif] = await connection.execute('SELECT id FROM notifications WHERE appointment_id = ? AND recipient_id = ? AND notification_type = "REMINDER"', [appt.id, appt.doctor_user_id]);
    if (dNotif.length === 0) {
      await connection.execute('INSERT INTO notifications (appointment_id, recipient_id, notification_type, status, subject, message_body) VALUES (?, ?, "REMINDER", "PENDING", ?, ?)', [appt.id, appt.doctor_user_id, 'Upcoming Appointment Reminder', 'Doctor Reminder Body']);
    }
  }

  const [notifications] = await connection.execute("SELECT recipient_id, notification_type FROM notifications WHERE notification_type = 'REMINDER'");
  console.log('Reminder notifications generated:', notifications);
  
  process.exit(0);
}

testReminders();
