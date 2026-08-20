const axios = require('axios');
const mysql = require('mysql2/promise');

(async () => {
  try {
    // 1. Login as Patient
    console.log('Logging in as Patient abc@gmail.com (id=2)...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', { email: 'abc@gmail.com', password: 'password123' });
    const token = loginRes.data.token;
    console.log('✅ Patient login successful.');

    // 2. Fetch doctors
    console.log('\\nFetching doctors...');
    const docRes = await axios.get('http://localhost:5000/api/patient/doctors?specialization=', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Doctors loaded successfully: ${docRes.data.length} found.`);
    const drSmith = docRes.data.find(d => d.name === 'Dr. Smith');
    if (!drSmith) throw new Error('Dr. Smith not found!');
    console.log('✅ Dr. Smith is selected.');

    // 3. Fetch available slots
    console.log('\\nFetching available slots...');
    const slotsRes = await axios.get(`http://localhost:5000/api/patient/doctors/${drSmith.id}/slots?date=2026-10-15`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Slots loaded: ${slotsRes.data.length} available slots found.`);
    if (slotsRes.data.length === 0) throw new Error('No slots available!');
    const slot = slotsRes.data[0];

    // 4. Book the appointment
    console.log('\\nBooking appointment...');
    const bookRes = await axios.post('http://localhost:5000/api/patient/appointments/book', {
      doctor_id: drSmith.id,
      date: '2026-10-15',
      start_time: slot.start,
      end_time: slot.end,
      symptoms: 'Integration Test Booking'
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('✅ Appointment booked successfully:', bookRes.data);

    // 5. Fetch appointments
    console.log('\\nFetching appointments...');
    const apptRes = await axios.get('http://localhost:5000/api/patient/appointments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Appointments fetched: ${apptRes.data.length} appointments.`);
    
    // Simulate PatientHome.jsx parsing
    const appts = apptRes.data;
    const upcomingAppts = appts.filter(a => {
      const apptDateStr = a.appointment_date.split('T')[0];
      return a.status === 'BOOKED' && new Date(`${apptDateStr}T${a.start_time}`) >= new Date();
    });
    console.log(`✅ PatientHome parsed upcoming appointments count: ${upcomingAppts.length}`);
    if (upcomingAppts.length === 0) throw new Error('PatientHome failed to parse dates correctly!');

    // 6. Test Rescheduling
    console.log('\\nTesting rescheduling...');
    const apptToReschedule = appts.find(a => a.symptoms === 'Integration Test Booking');
    
    const rescheduleSlots = await axios.get(`http://localhost:5000/api/patient/doctors/${drSmith.id}/slots?date=2026-10-16`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Reschedule Slots loaded: ${rescheduleSlots.data.length} available slots found.`);
    const newSlot = rescheduleSlots.data[0];

    const rescheduleRes = await axios.put(`http://localhost:5000/api/patient/appointments/${apptToReschedule.id}/reschedule`, {
      date: '2026-10-16',
      start_time: newSlot.start,
      end_time: newSlot.end
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('✅ Appointment rescheduled successfully:', rescheduleRes.data);

  } catch(e) {
    console.error('❌ Test Failed!', e.response ? e.response.data : e.message);
  }
})();
