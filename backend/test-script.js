require('dotenv').config();
const db = require('./src/db');
const { parseFrequency } = require('./src/jobs/cronJobs');
const calendarService = require('./src/services/calendarService');

const runTests = async () => {
  console.log('--- TEST D: MEDICATION FREQUENCY PARSING ---');
  console.log("Paracetamol 500mg twice daily for 3 days.", '=>', parseFrequency("Paracetamol 500mg twice daily for 3 days."));
  console.log("Take medicine every 8 hours.", '=>', parseFrequency("Take medicine every 8 hours."));
  console.log("Take medicine weekly.", '=>', parseFrequency("Take medicine weekly."));
  console.log("Unrecognized string", '=>', parseFrequency("Unrecognized string"));
  
  process.exit(0);
};

runTests();
