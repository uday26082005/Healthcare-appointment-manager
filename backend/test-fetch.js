const mysql = require('mysql2/promise');

(async () => {
  try {
    // 1. Admin login
    console.log('Logging in as Admin...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sudaykumar2608@gmail.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Admin login successful. Token acquired.');

    // 2. Fetch doctors
    console.log('\\nFetching doctors list as Admin...');
    const doctorsRes = await fetch('http://localhost:5000/api/admin/doctors', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const doctorsData = await doctorsRes.json();
    console.log('✅ Doctors loaded successfully:', doctorsData.length, 'found.');
    const drSmith = doctorsData.find(d => d.name === 'Dr. Smith');
    if (drSmith) {
      console.log('✅ Dr. Smith is present in the list. ID:', drSmith.id);
    } else {
      console.log('❌ Dr. Smith missing!');
    }

    // 3. Post leave
    console.log('\\nPosting a leave day for Dr. Smith...');
    const doctorId = drSmith.id;
    const leaveDate = '2026-10-01';
    const leaveRes = await fetch('http://localhost:5000/api/admin/doctors/' + doctorId + '/leaves', { 
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token 
      },
      body: JSON.stringify({ leave_date: leaveDate })
    });
    const leaveData = await leaveRes.json();
    console.log('✅ Leave posted successfully. Response:', leaveData);

    // 4. Verify in DB
    console.log('\\nVerifying leave in DB...');
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Uday@2608',
      database: 'healthcare_db'
    });
    const [rows] = await conn.execute('SELECT * FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?', [doctorId, leaveDate]);
    if (rows.length > 0) {
      console.log('✅ Leave verified in DB:', rows[0]);
    } else {
      console.log('❌ Leave missing in DB!');
    }
    await conn.end();

  } catch(e) {
    console.error('Test Failed!', e);
  }
})();
