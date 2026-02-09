const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3309,
    user: 'root', password: 'devroot123',
    database: 'prodrones_application'
  });

  // Test specific users
  const testUsers = [
    { email: 'test@local.dev', testPassword: 'password' },
    { email: 'test@local.dev', testPassword: 'test123' },
    { email: 'test@local.dev', testPassword: 'admin' },
    { email: 'test@local.dev', testPassword: 'Test1234' },
    { email: 'andres.salamanca+admin@prodrones.com', testPassword: null },
    { email: 'andres.salamanca+client@prodrones.com', testPassword: null },
    { email: 'andrew@prodrones.com', testPassword: null },
  ];

  // Get hashed passwords
  const emails = [...new Set(testUsers.map(t => t.email))];
  for (const email of emails) {
    const [rows] = await conn.query('SELECT ID, Email, Password FROM Users WHERE Email = ?', [email]);
    if (rows.length === 0) {
      console.log(`${email}: NOT FOUND`);
      continue;
    }
    const user = rows[0];
    const hash = user.Password;
    console.log(`\n${email} (ID: ${user.ID}):`);
    console.log(`  Hash: ${hash ? hash.substring(0, 20) + '...' : 'NULL'}`);

    // Test common passwords
    const passwords = ['password', 'test123', 'admin', 'Test1234', '123456', 'prodrones', 'Password1', 'test', 'admin123'];
    for (const pw of passwords) {
      if (hash) {
        try {
          const match = await bcrypt.compare(pw, hash);
          if (match) {
            console.log(`  *** PASSWORD MATCH: "${pw}" ***`);
          }
        } catch (e) {
          // Not a bcrypt hash, try direct compare
          if (hash === pw) {
            console.log(`  *** DIRECT MATCH: "${pw}" ***`);
          }
        }
      }
    }
  }

  await conn.end();
})();
