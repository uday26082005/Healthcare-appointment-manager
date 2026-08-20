const axios = require('axios');

(async () => {
  try {
    console.log('Logging in as Patient abc@gmail.com...');
    const patientLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'abc@gmail.com',
      password: 'password123'
    });
    const patientToken = patientLogin.data.token;
    console.log('? Patient login successful.');

    console.log('\nFetching patient appointments...');
    const patientAppts = await axios.get('http://localhost:5000/api/patient/appointments', {
      headers: { Authorization: 'Bearer ' + patientToken }
    });
    
    const appt = patientAppts.data.find(a => a.status === 'BOOKED');
    if (!appt) throw new Error('No BOOKED appointments found.');
    console.log('? Found BOOKED Appointment ID: ' + appt.id);
    console.log('? CONFIRMED: doctor_id returned from API -> ' + appt.doctor_id);

    if (!appt.doctor_id) throw new Error('doctor_id is still undefined!');

    const newDate = '2026-11-20';
    console.log('\nFetching available slots for Date: ' + newDate + '...');
    const slotsRes = await axios.get('http://localhost:5000/api/patient/doctors/' + appt.doctor_id + '/slots?date=' + newDate, {
      headers: { Authorization: 'Bearer ' + patientToken }
    });
    
    if (!slotsRes.data || slotsRes.data.length === 0) {
      throw new Error('No slots available for date');
    }
    console.log('? Slots fetched successfully: ' + slotsRes.data.length + ' available.');
    
    const selectedSlot = slotsRes.data[0];
    console.log('? Selected Slot: ' + selectedSlot.start + ' to ' + selectedSlot.end);

    console.log('\nSubmitting Reschedule Request...');
    const rescheduleRes = await axios.put('http://localhost:5000/api/patient/appointments/' + appt.id + '/reschedule', {
      date: newDate,
      start_time: selectedSlot.start,
      end_time: selectedSlot.end
    }, {
      headers: { Authorization: 'Bearer ' + patientToken }
    });
    
    console.log('? Reschedule API Result:', rescheduleRes.data);

    console.log('\nVerifying Database change...');
    const mysql = require('mysql2/promise');
    const conn = await mysql.createConnection({host: 'localhost', user: 'root', password: 'Uday@2608', database: 'healthcare_db'});
    const [rows] = await conn.execute('SELECT appointment_date, start_time, end_time FROM appointments WHERE id = ?', [appt.id]);
    
    const dbAppt = rows[0];
    const dbDate = new Date(dbAppt.appointment_date).toISOString().split('T')[0];
    console.log('? Database Date: ' + dbDate);
    console.log('? Database Start Time: ' + dbAppt.start_time);
    
    if (dbDate === newDate && dbAppt.start_time === selectedSlot.start) {
      console.log('? Database update completely verified!');
    } else {
      console.error('? Mismatch in DB: expected ' + newDate + ' / ' + selectedSlot.start + ', got ' + dbDate + ' / ' + dbAppt.start_time);
    }
    await conn.end();

  } catch (err) {
    console.error('? Test Failed!', err.response?.data || err.message);
  }
})();
