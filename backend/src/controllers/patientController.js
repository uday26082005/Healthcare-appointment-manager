const db = require('../db');
const asyncHandler = require('express-async-handler');

// GET /api/patient/doctors
const searchDoctors = asyncHandler(async (req, res) => {
  const { specialization } = req.query;
  let query = `
    SELECT d.id, u.name, d.specialization, d.working_start, d.working_end, d.slot_duration 
    FROM doctors d 
    JOIN users u ON d.user_id = u.id
  `;
  const params = [];

  if (specialization) {
    query += ' WHERE d.specialization LIKE ?';
    params.push(`%${specialization}%`);
  }

  const [doctors] = await db.execute(query, params);
  res.json(doctors);
});

// Helper to generate time slots
const generateSlots = (start, end, duration) => {
  const slots = [];
  let current = new Date(`1970-01-01T${start}Z`);
  const endTime = new Date(`1970-01-01T${end}Z`);

  while (current < endTime) {
    const slotStart = current.toISOString().substr(11, 8);
    current.setMinutes(current.getMinutes() + duration);
    if (current <= endTime) {
      const slotEnd = current.toISOString().substr(11, 8);
      slots.push({ start: slotStart, end: slotEnd });
    }
  }
  return slots;
};

// GET /api/patient/doctors/:id/slots?date=YYYY-MM-DD
const getAvailableSlots = asyncHandler(async (req, res) => {
  const doctorId = req.params.id;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }

  // 1. Check if doctor is on leave
  const [leaves] = await db.execute('SELECT id FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?', [doctorId, date]);
  if (leaves.length > 0) {
    return res.json([]); // No slots on leave days
  }

  // 2. Get doctor config
  const [doctors] = await db.execute('SELECT working_start, working_end, slot_duration FROM doctors WHERE id = ?', [doctorId]);
  if (doctors.length === 0) {
    return res.status(404).json({ message: 'Doctor not found' });
  }
  const doc = doctors[0];

  // 3. Generate all possible slots
  const allSlots = generateSlots(doc.working_start, doc.working_end, doc.slot_duration);

  // 4. Get booked/held slots
  const [booked] = await db.execute(
    'SELECT start_time FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status != \'CANCELLED\'',
    [doctorId, date]
  );
  
  // Cleanup expired holds before checking
  await db.execute('DELETE FROM slot_holds WHERE expires_at < NOW()');

  const [held] = await db.execute(
    'SELECT start_time FROM slot_holds WHERE doctor_id = ? AND hold_date = ?',
    [doctorId, date]
  );

  const unavailableStarts = new Set([
    ...booked.map(b => b.start_time),
    ...held.map(h => h.start_time)
  ]);

  const availableSlots = allSlots.filter(slot => !unavailableStarts.has(slot.start));

  res.json(availableSlots);
});

// POST /api/patient/appointments/hold
const holdSlot = asyncHandler(async (req, res) => {
  const { doctor_id, date, start_time } = req.body;
  const patient_id = req.user.id; // from auth middleware

  try {
    // 5-minute hold
    const expiresAt = new Date(Date.now() + 5 * 60000); 
    
    // DB unique constraint on (doctor_id, hold_date, start_time) prevents race conditions for holds
    await db.execute(
      'INSERT INTO slot_holds (doctor_id, hold_date, start_time, patient_id, expires_at) VALUES (?, ?, ?, ?, ?)',
      [doctor_id, date, start_time, patient_id, expiresAt]
    );

    res.status(201).json({ message: 'Slot held successfully', expiresAt });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Sorry, this slot is currently being booked by someone else.' });
    }
    res.status(500).json({ message: 'Error holding slot' });
  }
});

const llmService = require('../services/llmService');
const { queueAndSendNotification } = require('../services/notificationService');
const emailTemplates = require('../utils/emailTemplates');
const calendarService = require('../services/calendarService');

// GET /api/patient/appointments
const getAppointments = asyncHandler(async (req, res) => {
  const patientId = req.user.id;
  const [appointments] = await db.execute(`
    SELECT a.id, a.doctor_id, a.appointment_date, a.start_time, a.end_time, a.status,
           a.symptoms, a.doctor_notes, a.prescription, a.ai_postvisit_summary,
           a.ai_previsit_summary, a.urgency_level, a.chief_complaint, a.suggested_questions,
           d.specialization, u.name as doctor_name
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    JOIN users u ON d.user_id = u.id
    WHERE a.patient_id = ?
    ORDER BY a.appointment_date DESC, a.start_time DESC
  `, [patientId]);
  
  const mapped = appointments.map(app => {
    let questions = [];
    if (app.suggested_questions) {
      try {
        questions = JSON.parse(app.suggested_questions);
      } catch (e) {
        questions = [];
      }
    }
    return { ...app, suggested_questions: questions };
  });

  res.json(mapped);
});

// POST /api/patient/appointments/book
const bookAppointment = asyncHandler(async (req, res) => {
  const { doctor_id, date, start_time, end_time, symptoms } = req.body;
  const patient_id = req.user.id;

  const connection = await db.getConnection();
  let appointmentId;

  try {
    await connection.beginTransaction();

    // 1. Secure the slot (The strict UNIQUE constraint guarantees no double booking)
    const [result] = await connection.execute(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, symptoms) VALUES (?, ?, ?, ?, ?, ?)',
      [patient_id, doctor_id, date, start_time, end_time, symptoms || null]
    );
    appointmentId = result.insertId;

    // 2. Remove the hold
    await connection.execute(
      'DELETE FROM slot_holds WHERE doctor_id = ? AND hold_date = ? AND start_time = ?',
      [doctor_id, date, start_time]
    );

    // 3. Commit transaction so the appointment is 100% saved regardless of LLM
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    connection.release();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Sorry, this slot was just booked by another patient.' });
    }
    return res.status(500).json({ message: 'Error booking appointment', error: error.message });
  }

  // 4. Generate Pre-Visit AI Summary (Failures handled gracefully)
  let aiSummaryStatus = 'Pending';
  if (symptoms) {
    try {
      const aiResult = await llmService.generatePreVisitSummary(symptoms);
      
      // Update the already booked appointment
      await connection.execute(
        `UPDATE appointments 
         SET urgency_level = ?, chief_complaint = ?, suggested_questions = ?, ai_previsit_summary = ? 
         WHERE id = ?`,
        [
          aiResult.urgency_level, 
          aiResult.chief_complaint, 
          JSON.stringify(aiResult.suggested_questions),
          'Successfully generated from symptoms.', // General summary/notes if needed
          appointmentId
        ]
      );
      aiSummaryStatus = 'Success';
    } catch (llmError) {
      console.error('LLM Pre-Visit Error:', llmError.message);
      aiSummaryStatus = 'Unavailable';
      // Store a safe fallback state
      await connection.execute(
        `UPDATE appointments SET ai_previsit_summary = ? WHERE id = ?`,
        ['AI summary is currently unavailable. Please review the original symptoms.', appointmentId]
      );
    }
  }

  connection.release();

  res.status(201).json({ 
    message: 'Appointment booked successfully', 
    appointmentId,
    aiSummaryStatus 
  });

  // 5. Trigger Notifications (Async, does not affect response)
  try {
    const [patientData] = await db.execute('SELECT email, name FROM users WHERE id = ?', [patient_id]);
    const [docData] = await db.execute('SELECT u.email, u.name, d.specialization FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = ?', [doctor_id]);
    
    if (patientData.length > 0 && docData.length > 0) {
      const p = patientData[0];
      const d = docData[0];
        
      const msgPatient = `Hello ${p.name},\nYour appointment with ${d.name} (${d.specialization}) is confirmed for ${date} from ${start_time} to ${end_time}.`;
      const htmlPatient = emailTemplates.appointmentConfirmation({
        patientName: p.name,
        doctorName: d.name,
        specialization: d.specialization,
        date,
        startTime: start_time,
        endTime: end_time
      });
      queueAndSendNotification(appointmentId, patient_id, p.email, 'BOOKING', 'Appointment Confirmation', msgPatient, htmlPatient);
      
      // Notify Doctor
      const msgDoctor = `Hello ${d.name},\nA new appointment has been booked by ${p.name} for ${date} from ${start_time} to ${end_time}.`;
      const htmlDoctor = emailTemplates.appointmentConfirmation({
        patientName: d.name,
        doctorName: d.name,
        specialization: d.specialization,
        date,
        startTime: start_time,
        endTime: end_time
      });
      // We need doctor user_id to store in recipient_id
      const [docUser] = await db.execute('SELECT user_id FROM doctors WHERE id = ?', [doctor_id]);
      if (docUser.length > 0) {
        queueAndSendNotification(appointmentId, docUser[0].user_id, d.email, 'BOOKING', 'New Appointment Booking', msgDoctor, htmlDoctor);
      }
    }
  } catch (error) {
    console.error('Failed to trigger notifications on booking:', error);
  }

  // Trigger Google Calendar Event (Phase 3)
  try {
    const [docData] = await db.execute('SELECT u.name, d.specialization FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = ?', [doctor_id]);
    const eventDetails = {
      summary: `Medical Appointment with ${docData[0]?.name || 'Doctor'}`,
      description: `Specialization: ${docData[0]?.specialization || 'General'}nSymptoms: ${symptoms || 'None provided'}`,
      date,
      start_time,
      end_time
    };
    // Patient calendar
    calendarService.createEvent(patient_id, appointmentId, eventDetails);
    
    // Doctor calendar (Optional, if doctor linked calendar)
    const [docUser] = await db.execute('SELECT user_id FROM doctors WHERE id = ?', [doctor_id]);
    if (docUser.length > 0) {
      calendarService.createEvent(docUser[0].user_id, appointmentId, eventDetails);
    }
  } catch (calError) {
    console.error('Failed to trigger calendar creation:', calError);
  }
});

// PUT /api/patient/appointments/:id/cancel
const cancelAppointment = asyncHandler(async (req, res) => {
  const appointmentId = req.params.id;
  const patientId = req.user.id;

  const [appointments] = await db.execute(
    'SELECT a.*, d.user_id as doctor_user_id FROM appointments a JOIN doctors d ON a.doctor_id = d.id WHERE a.id = ? AND a.patient_id = ? AND a.status = \'BOOKED\'',
    [appointmentId, patientId]
  );

  if (appointments.length === 0) {
    return res.status(404).json({ message: 'Appointment not found or cannot be cancelled' });
  }

  const appt = appointments[0];

  await db.execute('UPDATE appointments SET status = \'CANCELLED\' WHERE id = ?', [appointmentId]);
  res.json({ message: 'Appointment cancelled successfully' });

  // Trigger Notifications
  try {
    const [patientData] = await db.execute('SELECT email, name FROM users WHERE id = ?', [patientId]);
    const [docData] = await db.execute('SELECT email, name FROM users WHERE id = ?', [appt.doctor_user_id]);

    const cancelMsg = `The appointment scheduled for ${appt.appointment_date} at ${appt.start_time} has been cancelled.`;
    
    if (patientData.length > 0) {
      const htmlPatient = emailTemplates.appointmentCancelled({
        patientName: patientData[0].name,
        doctorName: docData.length > 0 ? docData[0].name : '',
        specialization: '',
        date: appt.appointment_date,
        startTime: appt.start_time
      });
      queueAndSendNotification(appointmentId, patientId, patientData[0].email, 'CANCELLATION', 'Appointment Cancelled', cancelMsg, htmlPatient);
    }
    if (docData.length > 0) {
      const htmlDoctor = emailTemplates.appointmentCancelled({
        patientName: docData[0].name,
        doctorName: docData[0].name,
        specialization: '',
        date: appt.appointment_date,
        startTime: appt.start_time
      });
      queueAndSendNotification(appointmentId, appt.doctor_user_id, docData[0].email, 'CANCELLATION', 'Appointment Cancelled', cancelMsg, htmlDoctor);
    }
  } catch (err) {
    console.error('Cancellation notification error:', err);
  }

  // Cancel Calendar Event (Phase 3)
  try {
    calendarService.cancelEvent(patientId, appointmentId);
    calendarService.cancelEvent(appt.doctor_user_id, appointmentId);
  } catch (err) {
    console.error('Calendar cancellation error:', err);
  }
});

// PUT /api/patient/appointments/:id/reschedule
const rescheduleAppointment = asyncHandler(async (req, res) => {
  const appointmentId = req.params.id;
  const patientId = req.user.id;
  const { date, start_time, end_time } = req.body;

  const [appointments] = await db.execute(
    'SELECT a.*, d.user_id as doctor_user_id FROM appointments a JOIN doctors d ON a.doctor_id = d.id WHERE a.id = ? AND a.patient_id = ? AND a.status = \'BOOKED\'',
    [appointmentId, patientId]
  );

  if (appointments.length === 0) {
    return res.status(404).json({ message: 'Appointment not found or cannot be rescheduled' });
  }

  const appt = appointments[0];

  try {
    // Check if slot is booked by someone else
    const [existing] = await db.execute(
      "SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND start_time = ? AND status != 'CANCELLED'",
      [appt.doctor_id, date, start_time]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Slot already booked' });
    }

    await db.execute(
      'UPDATE appointments SET appointment_date = ?, start_time = ?, end_time = ? WHERE id = ?',
      [date, start_time, end_time, appointmentId]
    );
    res.json({ message: 'Appointment rescheduled successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Slot already booked' });
    }
    return res.status(500).json({ message: 'Rescheduling failed' });
  }

  // Trigger Notifications
  try {
    const [patientData] = await db.execute('SELECT email, name FROM users WHERE id = ?', [patientId]);
    const [docData] = await db.execute('SELECT email, name FROM users WHERE id = ?', [appt.doctor_user_id]);

    const msg = `The appointment has been rescheduled to ${date} at ${start_time}.`;
    if (patientData.length > 0) {
      const htmlPatient = emailTemplates.appointmentRescheduled({
        patientName: patientData[0].name,
        doctorName: docData.length > 0 ? docData[0].name : '',
        specialization: '',
        date,
        startTime: start_time,
        endTime: end_time
      });
      queueAndSendNotification(appointmentId, patientId, patientData[0].email, 'BOOKING', 'Appointment Rescheduled', msg, htmlPatient);
    }
    if (docData.length > 0) {
      const htmlDoctor = emailTemplates.appointmentRescheduled({
        patientName: docData[0].name,
        doctorName: docData[0].name,
        specialization: '',
        date,
        startTime: start_time,
        endTime: end_time
      });
      queueAndSendNotification(appointmentId, appt.doctor_user_id, docData[0].email, 'BOOKING', 'Appointment Rescheduled', msg, htmlDoctor);
    }
  } catch (err) {
    console.error('Reschedule notification error:', err);
  }

  // Calendar Event Update
  try {
    const [docData] = await db.execute('SELECT u.name, d.specialization FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = ?', [appt.doctor_id]);
    const eventDetails = {
      summary: `Medical Appointment with ${docData[0]?.name || 'Doctor'} (Rescheduled)`,
      description: `Specialization: ${docData[0]?.specialization || 'General'}nSymptoms: ${appt.symptoms || 'None provided'}`,
      date,
      start_time,
      end_time
    };
    calendarService.updateEvent(patientId, appointmentId, eventDetails);
    calendarService.updateEvent(appt.doctor_user_id, appointmentId, eventDetails);
  } catch (err) {
    console.error('Calendar reschedule error:', err);
  }
});

module.exports = { searchDoctors, getAvailableSlots, holdSlot, bookAppointment, getAppointments, cancelAppointment, rescheduleAppointment };
