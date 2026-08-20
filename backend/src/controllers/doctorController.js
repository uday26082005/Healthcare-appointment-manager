const db = require('../db');
const asyncHandler = require('express-async-handler');
const llmService = require('../services/llmService');

// GET /api/doctor/appointments
const getAppointments = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Find doctor_id for this user
  const [doctors] = await db.execute('SELECT id FROM doctors WHERE user_id = ?', [userId]);
  if (doctors.length === 0) {
    return res.status(404).json({ message: 'Doctor profile not found' });
  }
  const doctorId = doctors[0].id;

  const [appointments] = await db.execute(`
    SELECT a.id, a.appointment_date, a.start_time, a.end_time, a.status, 
           a.symptoms, a.ai_previsit_summary, a.urgency_level, a.chief_complaint, a.suggested_questions,
           u.name as patient_name, u.email as patient_email
    FROM appointments a
    JOIN users u ON a.patient_id = u.id
    WHERE a.doctor_id = ?
    ORDER BY a.appointment_date ASC, a.start_time ASC
  `, [doctorId]);

  // Parse suggested_questions if it exists since it's stored as JSON string
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

// PUT /api/doctor/appointments/:id/consultation
const submitConsultation = asyncHandler(async (req, res) => {
  const appointmentId = req.params.id;
  const { notes, prescription } = req.body;
  const userId = req.user.id;

  if (!notes || !prescription) {
    return res.status(400).json({ message: 'Please provide both clinical notes and a prescription' });
  }

  // 1. Validate appointment belongs to this doctor
  const [doctors] = await db.execute('SELECT id FROM doctors WHERE user_id = ?', [userId]);
  if (doctors.length === 0) {
    return res.status(404).json({ message: 'Doctor profile not found' });
  }
  const doctorId = doctors[0].id;

  const [appointments] = await db.execute('SELECT id FROM appointments WHERE id = ? AND doctor_id = ?', [appointmentId, doctorId]);
  if (appointments.length === 0) {
    return res.status(403).json({ message: 'Not authorized to update this appointment' });
  }

  // 2 & 3. Save clinical notes and prescription
  await db.execute(
    'UPDATE appointments SET doctor_notes = ?, prescription = ?, status = \'COMPLETED\' WHERE id = ?',
    [notes, prescription, appointmentId]
  );

  // 4 & 5. Generate Post-Visit AI Summary (Graceful failure)
  let aiSummaryStatus = 'Success';
  try {
    const summary = await llmService.generatePostVisitSummary(notes, prescription);
    await db.execute(
      'UPDATE appointments SET ai_postvisit_summary = ? WHERE id = ?',
      [summary, appointmentId]
    );
  } catch (error) {
    console.error('LLM Post-Visit Error:', error.message);
    aiSummaryStatus = 'Unavailable';
    await db.execute(
      'UPDATE appointments SET ai_postvisit_summary = ? WHERE id = ?',
      ['AI summary is temporarily unavailable. Please refer directly to the clinical notes.', appointmentId]
    );
  }

  res.json({
    message: 'Consultation submitted and appointment completed successfully',
    aiSummaryStatus
  });
});

module.exports = { getAppointments, submitConsultation };
