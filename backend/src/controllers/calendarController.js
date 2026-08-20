const asyncHandler = require('express-async-handler');
const calendarService = require('../services/calendarService');

// GET /api/calendar/auth
const getCalendarAuth = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const url = calendarService.getAuthUrl(userId);
  res.json({ url });
});

// GET /api/calendar/callback
const calendarCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.status(400).json({ message: 'Missing code or state' });
  }

  const userId = parseInt(state, 10);
  try {
    await calendarService.saveTokens(code, userId);
    res.send('Calendar linked successfully! You can close this window.');
  } catch (err) {
    console.error('Calendar linking failed:', err.message);
    res.status(500).send('Failed to link Google Calendar.');
  }
});

module.exports = { getCalendarAuth, calendarCallback };
