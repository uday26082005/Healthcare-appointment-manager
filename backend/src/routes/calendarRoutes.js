const express = require('express');
const { getCalendarAuth, calendarCallback } = require('../controllers/calendarController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/auth', protect, getCalendarAuth);
router.get('/callback', calendarCallback); // Redirect from Google doesn't have Authorization header, so state carries user ID securely enough for this MVP

module.exports = router;
