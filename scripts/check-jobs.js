const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection('mysql://root:devroot123@localhost:3309/prodrones_application');

  // Pipeline distribution
  const [pipelines] = await conn.execute('SELECT pipeline, COUNT(*) as c FROM Jobs GROUP BY pipeline ORDER BY c DESC');
  console.log('=== Pipeline Distribution ===');
  pipelines.forEach(p => console.log('  ' + p.pipeline + ': ' + p.c));

  // Sample jobs with full data (one per pipeline)
  const pipelineNames = ['bids', 'scheduled', 'processing-deliver', 'bill', 'completed'];
  for (const pl of pipelineNames) {
    const [jobs] = await conn.execute('SELECT j.id, j.pipeline, j.name, j.client, j.dates, j.siteId, j.products, j.client_id, j.client_type, s.name as site_name FROM Jobs j LEFT JOIN Sites s ON j.siteId = s.id WHERE j.pipeline = ? LIMIT 2', [pl]);
    if (jobs.length > 0) {
      console.log('\n=== Sample ' + pl + ' jobs ===');
      for (const j of jobs) {
        console.log('  Job #' + j.id + ' | site: ' + j.site_name + ' (siteId:' + j.siteId + ')');
        console.log('    client:', JSON.stringify(j.client));
        console.log('    dates:', JSON.stringify(j.dates));
        console.log('    products:', JSON.stringify(j.products));

        // Get meta for this job
        const [meta] = await conn.execute('SELECT meta_key, meta_value FROM Job_Meta WHERE job_id = ?', [j.id]);
        const metaObj = {};
        meta.forEach(m => { metaObj[m.meta_key] = m.meta_value ? m.meta_value.substring(0, 100) : null; });
        console.log('    meta:', JSON.stringify(metaObj));

        // Get client name
        if (j.client_type === 'organization') {
          const [org] = await conn.execute('SELECT name FROM Organization WHERE id = ?', [j.client_id]);
          if (org.length) console.log('    client_name:', org[0].name);
        } else if (j.client_type === 'user') {
          const [user] = await conn.execute("SELECT meta_value FROM User_Meta WHERE uid = ? AND meta_key = 'first_name'", [j.client_id]);
          const [userLast] = await conn.execute("SELECT meta_value FROM User_Meta WHERE uid = ? AND meta_key = 'last_name'", [j.client_id]);
          if (user.length) console.log('    client_name:', (user[0].meta_value || '') + ' ' + (userLast.length ? userLast[0].meta_value : ''));
        }
      }
    }
  }

  // Check products structure
  const [prodSample] = await conn.execute('SELECT id, name, deliverable_template FROM Products');
  console.log('\n=== Products Map ===');
  prodSample.forEach(p => console.log('  ' + p.id + ': ' + p.name + (p.deliverable_template ? ' [' + p.deliverable_template + ']' : '')));

  await conn.end();
})().catch(e => console.error('ERROR:', e.message));
