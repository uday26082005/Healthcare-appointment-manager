const express = require('express');
const { searchDoctors, getAvailableSlots, holdSlot, bookAppointment, getAppointments, cancelAppointment, rescheduleAppointment } = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.use(authorize('PATIENT'));

router.get('/appointments', getAppointments);
router.get('/doctors', searchDoctors);
router.get('/doctors/:id/slots', getAvailableSlots);
router.post('/appointments/hold', holdSlot);
router.post('/appointments/book', bookAppointment);
router.put('/appointments/:id/cancel', cancelAppointment);
router.put('/appointments/:id/reschedule', rescheduleAppointment);

module.exports = router;
