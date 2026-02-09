const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3309,
    user: 'root', password: 'devroot123',
    database: 'prodrones_application'
  });

  const [users] = await conn.query('SELECT u.ID, u.Email, u.Password FROM Users u ORDER BY u.ID');
  const [metas] = await conn.query("SELECT uid, meta_key, meta_value FROM User_Meta WHERE meta_key IN ('roles', 'first_name', 'last_name')");

  const metaByUser = {};
  for (const m of metas) {
    if (!metaByUser[m.uid]) metaByUser[m.uid] = {};
    metaByUser[m.uid][m.meta_key] = m.meta_value;
  }

  const ROLE_NAMES = { 0: 'Admin', 1: 'Client', 3: 'Registered', 4: 'Developer', 5: 'Staff', 6: 'Pilot', 7: 'Manager' };

  console.log('=== ALL USERS WITH ROLES ===\n');
  for (const u of users) {
    const meta = metaByUser[u.ID] || {};
    const name = [meta.first_name, meta.last_name].filter(Boolean).join(' ');
    let roles = [];
    try { roles = JSON.parse(meta.roles || '[]'); } catch {}
    const roleNames = roles.map(r => ROLE_NAMES[r] || `Role${r}`);
    const hasPassword = u.Password ? 'YES' : 'NO';
    console.log(`ID: ${u.ID} | Email: ${u.Email} | Name: ${name || '(no name)'} | Password: ${hasPassword} | Roles: [${roleNames.join(', ')}]`);
  }

  await conn.end();
})();
