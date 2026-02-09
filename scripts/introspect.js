const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection('mysql://root:devroot123@localhost:3309/prodrones_application');

  const [tables] = await conn.execute('SHOW TABLES');
  const tableNames = tables.map(r => Object.values(r)[0]);
  console.log('TABLES (' + tableNames.length + '):', tableNames.join(', '));
  console.log('');

  for (const table of tableNames) {
    console.log('=== ' + table + ' ===');
    const [cols] = await conn.execute('SHOW COLUMNS FROM `' + table + '`');
    cols.forEach(c => {
      console.log('  ' + c.Field + ' | ' + c.Type + ' | ' + (c.Null === 'YES' ? 'NULL' : 'NOT NULL') + ' | Key:' + (c.Key || '-') + ' | Default:' + (c.Default !== null ? c.Default : 'none') + ' | ' + (c.Extra || ''));
    });
    const [count] = await conn.execute('SELECT COUNT(*) as c FROM `' + table + '`');
    console.log('  ROWS:', count[0].c);
    console.log('');
  }

  // Stored procedures
  const [procs] = await conn.execute("SHOW PROCEDURE STATUS WHERE Db = 'prodrones_application'");
  if (procs.length > 0) {
    console.log('=== STORED PROCEDURES ===');
    for (const p of procs) {
      console.log('  ' + p.Name);
      const [body] = await conn.execute('SHOW CREATE PROCEDURE `' + p.Name + '`');
      console.log(body[0]['Create Procedure']);
      console.log('');
    }
  }

  // Foreign keys
  const [fks] = await conn.execute("SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = 'prodrones_application' AND REFERENCED_TABLE_NAME IS NOT NULL");
  if (fks.length > 0) {
    console.log('=== FOREIGN KEYS ===');
    fks.forEach(fk => console.log('  ' + fk.TABLE_NAME + '.' + fk.COLUMN_NAME + ' -> ' + fk.REFERENCED_TABLE_NAME + '.' + fk.REFERENCED_COLUMN_NAME));
  }

  await conn.end();
})().catch(e => console.error('ERROR:', e.message));
