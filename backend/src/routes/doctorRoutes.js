const express = require('express');
const { getAppointments, submitConsultation } = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.use(authorize('DOCTOR'));

router.get('/appointments', getAppointments);
router.put('/appointments/:id/consultation', submitConsultation);

module.exports = router;
