require('dotenv').config();
const { initCronJobs } = require('./src/jobs/cronJobs');
// Instead of scheduling, just extract the reminder logic and run it once
const db = require('./src/db');
async function run() {
  const connection = await db.getConnection();
  const rows = await connection.execute("SELECT id FROM appointments WHERE status='BOOKED'");
  console.log('Appointments found:', rows[0].length);
  // Just run the job manually via the exported parseFrequency... actually I didn't export the job.
  // I will just rely on node-cron by triggering it, or just copy the logic.
  process.exit(0);
}
run();
