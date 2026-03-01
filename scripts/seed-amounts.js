const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3309,
    user: 'root', password: 'devroot123',
    database: 'prodrones_application'
  });

  // Get all jobs that don't have amount_payable yet
  const [jobs] = await conn.execute(`
    SELECT j.id, j.pipeline FROM Jobs j
    LEFT JOIN Job_Meta jm ON j.id = jm.job_id AND jm.meta_key = 'amount_payable'
    WHERE jm.job_id IS NULL
  `);

  console.log('Jobs without amount_payable:', jobs.length);

  const amounts = {
    'bids':                [800, 1200, 950, 1500, 1100],
    'scheduled':           [1400, 2200, 1800, 2500, 1600],
    'processing-deliver':  [1750, 2400, 1900, 2800, 2100],
    'bill':                [1600, 2000, 1850, 2600, 2300],
    'completed':           [1200, 1800, 2100, 1500, 2400, 1950, 1700],
  };

  const counters = {};
  for (const job of jobs) {
    const pool = amounts[job.pipeline] || [1000, 1500, 2000];
    const idx = (counters[job.pipeline] || 0) % pool.length;
    counters[job.pipeline] = idx + 1;
    const amount = pool[idx].toFixed(2);
    await conn.execute(
      'INSERT INTO Job_Meta (job_id, meta_key, meta_value) VALUES (?, ?, ?)',
      [job.id, 'amount_payable', amount]
    );
    process.stdout.write('.');
  }

  console.log('\nDone!');

  // Show totals
  const [totals] = await conn.execute(`
    SELECT j.pipeline, COUNT(*) as jobs, SUM(jm.meta_value + 0) as total
    FROM Jobs j
    JOIN Job_Meta jm ON j.id = jm.job_id AND jm.meta_key = 'amount_payable'
    GROUP BY j.pipeline
    ORDER BY FIELD(j.pipeline, 'bids','scheduled','processing-deliver','bill','completed')
  `);

  console.log('\nTotals by pipeline:');
  totals.forEach(r => {
    console.log(`  ${r.pipeline}: ${r.jobs} jobs = $${parseFloat(r.total).toFixed(2)}`);
  });

  await conn.end();
}

main().catch(console.error);
