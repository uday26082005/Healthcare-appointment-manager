const { google } = require('googleapis');
const db = require('../db');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Get OAuth URL
const getAuthUrl = (userId) => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: userId.toString()
  });
};

// Handle OAuth Callback
const saveTokens = async (code, userId) => {
  const { tokens } = await oauth2Client.getToken(code);
  const connection = await db.getConnection();
  try {
    await connection.execute(
      'UPDATE users SET google_access_token = ?, google_refresh_token = ? WHERE id = ?',
      [tokens.access_token, tokens.refresh_token || null, userId]
    );
  } finally {
    connection.release();
  }
};

// Helper to get user role and token
const getUserData = async (connection, userId) => {
  const [users] = await connection.execute('SELECT role, google_access_token, google_refresh_token FROM users WHERE id = ?', [userId]);
  if (users.length === 0 || !users[0].google_access_token) return null;
  return users[0];
};

// Helper to construct event
const buildEventResource = (eventDetails) => ({
  summary: eventDetails.summary,
  description: eventDetails.description,
  start: {
    dateTime: new Date(`${eventDetails.date}T${eventDetails.start_time}`).toISOString(),
    timeZone: 'UTC',
  },
  end: {
    dateTime: new Date(`${eventDetails.date}T${eventDetails.end_time}`).toISOString(),
    timeZone: 'UTC',
  }
});

// Create Calendar Event
const createEvent = async (userId, appointmentId, eventDetails) => {
  const connection = await db.getConnection();
  try {
    const user = await getUserData(connection, userId);
    if (!user) return; // Silent fail if no calendar linked

    const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    client.setCredentials({ access_token: user.google_access_token, refresh_token: user.google_refresh_token });
    const calendar = google.calendar({ version: 'v3', auth: client });
    
    const res = await calendar.events.insert({ calendarId: 'primary', resource: buildEventResource(eventDetails) });
    const column = user.role === 'DOCTOR' ? 'doctor_event_id' : 'patient_event_id';

    // Upsert to maintain EXACTLY ONE row per appointment
    await connection.execute(
      `INSERT INTO calendar_events (appointment_id, ${column}) VALUES (?, ?) ON DUPLICATE KEY UPDATE ${column} = VALUES(${column})`,
      [appointmentId, res.data.id]
    );

  } catch (error) {
    console.error('Calendar Create Event Error:', error.message);
  } finally {
    connection.release();
  }
};

// Update Calendar Event
const updateEvent = async (userId, appointmentId, eventDetails) => {
  const connection = await db.getConnection();
  try {
    const user = await getUserData(connection, userId);
    if (!user) return;

    const column = user.role === 'DOCTOR' ? 'doctor_event_id' : 'patient_event_id';
    const [events] = await connection.execute(`SELECT ${column} as event_id FROM calendar_events WHERE appointment_id = ?`, [appointmentId]);
    if (events.length === 0 || !events[0].event_id) return;

    const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    client.setCredentials({ access_token: user.google_access_token, refresh_token: user.google_refresh_token });
    const calendar = google.calendar({ version: 'v3', auth: client });

    await calendar.events.update({
      calendarId: 'primary',
      eventId: events[0].event_id,
      resource: buildEventResource(eventDetails),
    });

  } catch (error) {
    console.error('Calendar Update Event Error:', error.message);
  } finally {
    connection.release();
  }
};

// Cancel Calendar Event
const cancelEvent = async (userId, appointmentId) => {
  const connection = await db.getConnection();
  try {
    const user = await getUserData(connection, userId);
    if (!user) return;

    const column = user.role === 'DOCTOR' ? 'doctor_event_id' : 'patient_event_id';
    const [events] = await connection.execute(`SELECT ${column} as event_id FROM calendar_events WHERE appointment_id = ?`, [appointmentId]);
    if (events.length === 0 || !events[0].event_id) return;

    const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    client.setCredentials({ access_token: user.google_access_token, refresh_token: user.google_refresh_token });
    const calendar = google.calendar({ version: 'v3', auth: client });

    await calendar.events.delete({ calendarId: 'primary', eventId: events[0].event_id });

    // We can clear the ID instead of deleting the row, to avoid wiping the other user's record
    await connection.execute(`UPDATE calendar_events SET ${column} = NULL WHERE appointment_id = ?`, [appointmentId]);

  } catch (error) {
    console.error('Calendar Cancel Event Error:', error.message);
  } finally {
    connection.release();
  }
};

module.exports = { getAuthUrl, saveTokens, createEvent, updateEvent, cancelEvent };
