const cron = require('node-cron');
const db = require('../db');
const { sendEmail } = require('../services/emailService');
const emailTemplates = require('../utils/emailTemplates');

// Simple parser for medication frequency
const parseFrequency = (text) => {
  if (!text) return { freq: 'Daily', hours: 24 };
  const lower = text.toLowerCase();
  
  if (lower.includes('every 6 hours')) return { freq: 'Every 6 hours', hours: 6 };
  if (lower.includes('every 8 hours')) return { freq: 'Every 8 hours', hours: 8 };
  if (lower.includes('every 12 hours')) return { freq: 'Every 12 hours', hours: 12 };
  if (lower.includes('every 24 hours')) return { freq: 'Every 24 hours', hours: 24 };
  
  if (lower.includes('twice daily') || lower.includes('two times daily')) return { freq: 'Twice Daily', hours: 12 };
  if (lower.includes('three times daily') || lower.includes('three times a day')) return { freq: 'Three Times Daily', hours: 8 };
  
  if (lower.includes('weekly') || lower.includes('once a week')) return { freq: 'Weekly', hours: 7 * 24 };
  if (lower.includes('once daily') || lower.includes('daily')) return { freq: 'Daily', hours: 24 };
  
  return { freq: 'Daily (Fallback)', hours: 24 };
};

const initCronJobs = () => {
  // 1. Email Retry Job (Runs every 10 minutes)
  cron.schedule('*/10 * * * *', async () => {
    console.log('Running Email Retry Cron Job...');
    const connection = await db.getConnection();
    try {
      const [notifications] = await connection.execute(
        'SELECT n.id, n.subject, n.message_body, n.retry_count, u.email FROM notifications n JOIN users u ON n.recipient_id = u.id WHERE n.status = \'FAILED\' AND n.retry_count < 3'
      );

      for (const n of notifications) {
        try {
          await sendEmail({ to: n.email, subject: n.subject, text: n.message_body });
          await connection.execute('UPDATE notifications SET status = \'SENT\', sent_at = NOW() WHERE id = ?', [n.id]);
        } catch (error) {
          await connection.execute('UPDATE notifications SET retry_count = retry_count + 1, last_error = ? WHERE id = ?', [error.message, n.id]);
        }
      }
    } catch (err) {
      console.error('Email Retry Job Error:', err);
    } finally {
      connection.release();
    }
  });

  // 2. Scheduled Reminders for upcoming appointments (Runs every hour)
  cron.schedule('0 * * * *', async () => {
    console.log('Running Appointment Reminder Cron Job...');
    const connection = await db.getConnection();
    try {
      const [appointments] = await connection.execute(`
        SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.start_time, 
               p.email as patient_email, p.name as patient_name, 
               d_user.id as doctor_user_id, d_user.email as doctor_email, d_user.name as doctor_name
        FROM appointments a
        JOIN users p ON a.patient_id = p.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users d_user ON d.user_id = d_user.id
        WHERE a.status = 'BOOKED' 
        AND CONCAT(a.appointment_date, ' ', a.start_time) BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
      `);

      for (const appt of appointments) {
        // Patient Reminder Logic
        try {
          const [pNotif] = await connection.execute('SELECT id FROM notifications WHERE appointment_id = ? AND recipient_id = ? AND notification_type = \'REMINDER\'', [appt.id, appt.patient_id]);
          if (pNotif.length === 0) {
            const subject = 'Upcoming Appointment Reminder';
            const message = `Hello ${appt.patient_name},\nThis is a reminder for your upcoming appointment with ${appt.doctor_name} on ${appt.appointment_date} at ${appt.start_time}.`;
            const htmlMessage = emailTemplates.appointmentReminder({
              patientName: appt.patient_name,
              doctorName: appt.doctor_name,
              date: appt.appointment_date,
              startTime: appt.start_time
            });
            const [res] = await connection.execute('INSERT INTO notifications (appointment_id, recipient_id, notification_type, status, subject, message_body) VALUES (?, ?, \'REMINDER\', \'PENDING\', ?, ?)', [appt.id, appt.patient_id, subject, message]);
            const notificationId = res.insertId;
            try {
              await sendEmail({ to: appt.patient_email, subject, text: message, html: htmlMessage });
              await connection.execute('UPDATE notifications SET status = \'SENT\', sent_at = NOW() WHERE id = ?', [notificationId]);
            } catch (err) {
              await connection.execute('UPDATE notifications SET status = \'FAILED\', last_error = ? WHERE id = ?', [err.message, notificationId]);
            }
          }
        } catch (err) { console.error('Patient Reminder Error:', err); }

        // Doctor Reminder Logic
        try {
          const [dNotif] = await connection.execute('SELECT id FROM notifications WHERE appointment_id = ? AND recipient_id = ? AND notification_type = \'REMINDER\'', [appt.id, appt.doctor_user_id]);
          if (dNotif.length === 0) {
            const subject = 'Upcoming Appointment Reminder';
            const message = `Hello ${appt.doctor_name},\nThis is a reminder for your upcoming appointment with patient ${appt.patient_name} on ${appt.appointment_date} at ${appt.start_time}.`;
            const htmlMessage = emailTemplates.appointmentReminder({
              patientName: appt.doctor_name,
              doctorName: appt.doctor_name,
              date: appt.appointment_date,
              startTime: appt.start_time
            });
            const [res] = await connection.execute('INSERT INTO notifications (appointment_id, recipient_id, notification_type, status, subject, message_body) VALUES (?, ?, \'REMINDER\', \'PENDING\', ?, ?)', [appt.id, appt.doctor_user_id, subject, message]);
            const notificationId = res.insertId;
            try {
              await sendEmail({ to: appt.doctor_email, subject, text: message, html: htmlMessage });
              await connection.execute('UPDATE notifications SET status = \'SENT\', sent_at = NOW() WHERE id = ?', [notificationId]);
            } catch (err) {
              await connection.execute('UPDATE notifications SET status = \'FAILED\', last_error = ? WHERE id = ?', [err.message, notificationId]);
            }
          }
        } catch (err) { console.error('Doctor Reminder Error:', err); }
      }
    } catch (err) {
      console.error('Appointment Reminder Job Error:', err);
    } finally {
      connection.release();
    }
  });

  // 3. Medication Reminders generation (Runs daily at 8 AM)
  cron.schedule('0 8 * * *', async () => {
    console.log('Running Medication Reminder Cron Job...');
    const connection = await db.getConnection();
    try {
      const [appointments] = await connection.execute(`
        SELECT a.id, a.patient_id, a.prescription, u.email, u.name 
        FROM appointments a
        JOIN users u ON a.patient_id = u.id
        WHERE a.status = 'COMPLETED' AND a.prescription IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM medication_reminders m WHERE m.appointment_id = a.id)
      `);

      for (const appt of appointments) {
        const med = appt.prescription.substring(0, 255);
        const parsed = parseFrequency(appt.prescription);
        await connection.execute(
          'INSERT INTO medication_reminders (appointment_id, patient_id, medication, frequency, interval_hours, next_reminder) VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))',
          [appt.id, appt.patient_id, med, parsed.freq, parsed.hours, parsed.hours]
        );
      }

      // Send active reminders
      const [dueReminders] = await connection.execute(`
        SELECT m.id, m.medication, m.interval_hours, u.email, u.name 
        FROM medication_reminders m
        JOIN users u ON m.patient_id = u.id
        WHERE m.status = 'ACTIVE' AND m.next_reminder <= NOW()
      `);

      for (const rem of dueReminders) {
        try {
          const subject = 'Medication Reminder';
          const message = `Hello ${rem.name},\nThis is your medication reminder:\n${rem.medication}`;
          const htmlMessage = emailTemplates.medicationReminder({
            patientName: rem.name,
            medication: rem.medication
          });
          await sendEmail({ to: rem.email, subject, text: message, html: htmlMessage });
          await connection.execute('UPDATE medication_reminders SET next_reminder = DATE_ADD(next_reminder, INTERVAL ? HOUR) WHERE id = ?', [rem.interval_hours, rem.id]);
        } catch (error) {
          console.error('Failed to send medication reminder:', error);
        }
      }

    } catch (err) {
      console.error('Medication Reminder Job Error:', err);
    } finally {
      connection.release();
    }
  });
};

module.exports = { initCronJobs, parseFrequency }; // export parseFrequency for testing
