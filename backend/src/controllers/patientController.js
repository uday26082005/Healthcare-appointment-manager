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
    'SELECT start_time FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status != "CANCELLED"',
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

// GET /api/patient/appointments
const getAppointments = asyncHandler(async (req, res) => {
  const patientId = req.user.id;
  const [appointments] = await db.execute(`
    SELECT a.id, a.appointment_date, a.start_time, a.end_time, a.status,
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
});

module.exports = { searchDoctors, getAvailableSlots, holdSlot, bookAppointment, getAppointments };
