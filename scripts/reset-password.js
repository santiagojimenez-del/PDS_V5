// Usage: node scripts/reset-password.js <email> <new-password>
// Example: node scripts/reset-password.js nick@prodrones.com MyPassword123

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async () => {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log('Usage: node scripts/reset-password.js <email> <new-password>');
    console.log('Example: node scripts/reset-password.js nick@prodrones.com MyPassword123');
    process.exit(1);
  }

  const conn = await mysql.createConnection('mysql://root:devroot123@localhost:3309/prodrones_application');

  // Check if user exists
  const [rows] = await conn.execute('SELECT ID, Email FROM Users WHERE Email = ?', [email]);
  if (!rows.length) {
    console.error('User not found:', email);
    await conn.end();
    process.exit(1);
  }

  // Hash new password with bcrypt cost 11 (matching existing system)
  const hash = await bcrypt.hash(newPassword, 11);

  await conn.execute('UPDATE Users SET Password = ? WHERE Email = ?', [hash, email]);
  console.log('Password updated for:', rows[0].Email, '(ID:', rows[0].ID + ')');
  console.log('New hash:', hash);

  await conn.end();
})().catch(e => console.error('ERROR:', e.message));
