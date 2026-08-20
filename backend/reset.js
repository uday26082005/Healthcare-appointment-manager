const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

(async () => {
  const conn = await mysql.createConnection({host: 'localhost', user: 'root', password: 'Uday@2608', database: 'healthcare_db'});
  const hash = await bcrypt.hash('password123', 10);
  console.log('Generated hash:', hash);
  await conn.execute('UPDATE users SET password_hash = ? WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8)', [hash]);
  console.log('All passwords updated to password123');
  await conn.end();
})();
