const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection('mysql://root:devroot123@localhost:3309/prodrones_application');

  // Get distinct meta_keys from User_Meta
  const [keys] = await conn.execute('SELECT DISTINCT meta_key FROM User_Meta ORDER BY meta_key');
  console.log('=== User_Meta keys ===');
  keys.forEach(k => console.log('  ' + k.meta_key));

  // Get sample user with all their meta
  const [sample] = await conn.execute('SELECT um.uid, u.Email, um.meta_key, um.meta_value FROM User_Meta um JOIN Users u ON u.ID = um.uid WHERE um.uid = 1');
  console.log('\n=== Sample user (ID=1) meta ===');
  sample.forEach(m => console.log('  ' + m.meta_key + ' = ' + (m.meta_value ? m.meta_value.substring(0, 200) : 'NULL')));

  // Get sample user tokens
  const [tokens] = await conn.execute('SELECT ID, Email, Tokens FROM Users WHERE ID = 1');
  console.log('\n=== User 1 tokens ===');
  console.log('  Email:', tokens[0].Email);
  console.log('  Tokens:', JSON.stringify(tokens[0].Tokens).substring(0, 500));

  // Get distinct meta_keys from Job_Meta
  const [jobKeys] = await conn.execute('SELECT DISTINCT meta_key FROM Job_Meta ORDER BY meta_key');
  console.log('\n=== Job_Meta keys ===');
  jobKeys.forEach(k => console.log('  ' + k.meta_key));

  // Get sample job
  const [sampleJob] = await conn.execute('SELECT id, pipeline, name, client, dates, siteId, products FROM Jobs LIMIT 1');
  console.log('\n=== Sample job ===');
  const j = sampleJob[0];
  console.log('  id:', j.id, '| pipeline:', j.pipeline, '| name:', j.name);
  console.log('  client:', JSON.stringify(j.client));
  console.log('  dates:', JSON.stringify(j.dates));
  console.log('  siteId:', j.siteId);
  console.log('  products:', JSON.stringify(j.products).substring(0, 300));

  // Get sample Pages
  const [samplePages] = await conn.execute('SELECT PageID, Application, Page, Design, NavGroup, RoleAccess FROM Pages LIMIT 5');
  console.log('\n=== Sample Pages ===');
  samplePages.forEach(p => {
    console.log('  ' + p.PageID + ' | ' + p.Application + ' | ' + p.Page);
    console.log('    Design:', JSON.stringify(p.Design).substring(0, 200));
    console.log('    NavGroup:', JSON.stringify(p.NavGroup));
    console.log('    RoleAccess:', JSON.stringify(p.RoleAccess));
  });

  // Get sample Configuration
  const [config] = await conn.execute('SELECT * FROM Configuration LIMIT 10');
  console.log('\n=== Sample Configuration ===');
  config.forEach(c => console.log('  [' + c.Application + '] ' + c.Name + ' = ' + c.Value.substring(0, 100)));

  // Get distinct Organization_Meta keys
  const [orgKeys] = await conn.execute('SELECT DISTINCT meta_key FROM Organization_Meta ORDER BY meta_key');
  console.log('\n=== Organization_Meta keys ===');
  orgKeys.forEach(k => console.log('  ' + k.meta_key));

  // Sample org
  const [sampleOrg] = await conn.execute('SELECT o.id, o.name, om.meta_key, om.meta_value FROM Organization o LEFT JOIN Organization_Meta om ON o.id = om.org_id WHERE o.id = 1');
  console.log('\n=== Sample Organization (ID=1) ===');
  sampleOrg.forEach(m => console.log('  ' + (m.meta_key || 'name') + ' = ' + (m.meta_value || m.name)));

  // Get Permissions table
  const [perms] = await conn.execute('SELECT name, category, label FROM Permissions ORDER BY priority');
  console.log('\n=== Permissions ===');
  perms.forEach(p => console.log('  ' + p.name + ' [' + p.category + '] ' + p.label));

  await conn.end();
})().catch(e => console.error('ERROR:', e.message));
