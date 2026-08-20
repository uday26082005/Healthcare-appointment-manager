const axios = require('axios');

(async () => {
  try {
    console.log('Logging in as Doctor smith@clinic.com...');
    const doctorLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'smith@clinic.com',
      password: 'password123'
    });
    const doctorToken = doctorLogin.data.token;
    console.log('? Doctor login successful.');

    console.log('\nFetching doctor appointments...');
    const doctorAppts = await axios.get('http://localhost:5000/api/doctor/appointments', {
      headers: { Authorization: 'Bearer ' + doctorToken }
    });
    
    const bookedAppt = doctorAppts.data.find(a => a.status === 'BOOKED');
    if (!bookedAppt) {
      throw new Error('No BOOKED appointments found for doctor.');
    }
    console.log('? Found BOOKED appointment ID: ' + bookedAppt.id + ' with Patient ' + bookedAppt.patient_email);

    console.log('\nSubmitting consultation...');
    const consultationRes = await axios.put('http://localhost:5000/api/doctor/appointments/' + bookedAppt.id + '/consultation', {
      notes: 'Patient shows mild symptoms. Prescribed rest and medication.',
      prescription: 'Ibuprofen 400mg twice a day for 5 days.'
    }, {
      headers: { Authorization: 'Bearer ' + doctorToken }
    });
    console.log('? Consultation submitted successfully:', consultationRes.data);

    console.log('\nLogging in as Patient...');
    const patientLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: bookedAppt.patient_email,
      password: 'password123'
    });
    const patientToken = patientLogin.data.token;
    console.log('? Patient login successful.');

    console.log('\nFetching patient appointments to verify...');
    const patientAppts = await axios.get('http://localhost:5000/api/patient/appointments', {
      headers: { Authorization: 'Bearer ' + patientToken }
    });
    
    const completedAppt = patientAppts.data.find(a => a.id === bookedAppt.id);
    if (!completedAppt) throw new Error('Appointment not found for patient.');
    
    if (completedAppt.status !== 'COMPLETED') {
      throw new Error('Appointment status is not COMPLETED! Status is ' + completedAppt.status);
    }
    console.log('? Status is COMPLETED');
    console.log('? Notes:', completedAppt.doctor_notes);
    console.log('? Prescription:', completedAppt.prescription);
    console.log('? AI Summary:', completedAppt.ai_postvisit_summary);

  } catch (err) {
    console.error('? Test Failed!', err.response?.data || err.message);
  }
})();
