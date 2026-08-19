const express = require('express');
const { createDoctor, getDoctors, addDoctorLeave } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// All admin routes are protected and require ADMIN role
router.use(protect);
router.use(authorize('ADMIN'));

router.post('/doctors', createDoctor);
router.get('/doctors', getDoctors);
router.post('/doctors/:id/leaves', addDoctorLeave);

module.exports = router;
