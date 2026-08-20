const db = require('../db');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

// POST /api/admin/doctors
const createDoctor = asyncHandler(async (req, res) => {
  const { name, email, password, specialization, working_start, working_end, slot_duration } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const [userRes] = await connection.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, 'DOCTOR']
    );

    const userId = userRes.insertId;

    const [docRes] = await connection.execute(
      'INSERT INTO doctors (user_id, specialization, working_start, working_end, slot_duration) VALUES (?, ?, ?, ?, ?)',
      [userId, specialization, working_start, working_end, slot_duration]
    );

    await connection.commit();
    res.status(201).json({ message: 'Doctor created', doctorId: docRes.insertId, userId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Error creating doctor', error: error.message });
  } finally {
    connection.release();
  }
});

// GET /api/admin/doctors
const getDoctors = asyncHandler(async (req, res) => {
  const [doctors] = await db.execute(`
    SELECT d.id, u.name, u.email, d.specialization, d.working_start, d.working_end, d.slot_duration 
    FROM doctors d 
    JOIN users u ON d.user_id = u.id
  `);
  res.json(doctors);
});

// POST /api/admin/doctors/:id/leaves
const addDoctorLeave = asyncHandler(async (req, res) => {
  const doctorId = req.params.id;
  const { leave_date, reason } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Insert leave
    await connection.execute(
      'INSERT INTO doctor_leaves (doctor_id, leave_date, reason) VALUES (?, ?, ?)',
      [doctorId, leave_date, reason]
    );

    // Find and cancel appointments for this date
    const [appointments] = await connection.execute(
      'SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status = \'BOOKED\'',
      [doctorId, leave_date]
    );

    if (appointments.length > 0) {
      await connection.execute(
        'UPDATE appointments SET status = \'CANCELLED\' WHERE doctor_id = ? AND appointment_date = ? AND status = \'BOOKED\'',
        [doctorId, leave_date]
      );
      
      // TODO: Queue email notifications for cancelled appointments (Phase 3)
    }

    await connection.commit();
    res.status(201).json({ message: 'Leave added and overlapping appointments cancelled', cancelledCount: appointments.length });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Leave for this date already exists' });
    }
    res.status(500).json({ message: 'Error adding leave', error: error.message });
  } finally {
    connection.release();
  }
});

module.exports = { createDoctor, getDoctors, addDoctorLeave };
