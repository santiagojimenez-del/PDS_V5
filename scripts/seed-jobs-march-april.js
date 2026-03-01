const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3309,
    user: 'root', password: 'devroot123',
    database: 'prodrones_application'
  });

  const jobs = [
    // ── BIDS ──────────────────────────────────────────────────────────────
    { name: 'Downtown Office Q1 Survey',     pipeline: 'bids', siteId: 1, client: {id:1,type:'organization'}, dates: {created:'2026-03-03T09:00:00.000Z'}, products: [7,4] },
    { name: 'Oceanfront Property Shoot',     pipeline: 'bids', siteId: 5, client: {id:5,type:'organization'}, dates: {created:'2026-03-10T10:00:00.000Z'}, products: [4,1] },
    { name: 'HOA Spring Inspection',         pipeline: 'bids', siteId: 2, client: {id:2,type:'organization'}, dates: {created:'2026-03-18T14:00:00.000Z'}, products: [2,5] },
    { name: 'Orlando Park Progress Doc',     pipeline: 'bids', siteId: 6, client: {id:3,type:'organization'}, dates: {created:'2026-04-02T09:30:00.000Z'}, products: [6,8] },
    { name: 'Santa Monica Pier Assessment',  pipeline: 'bids', siteId: 7, client: {id:4,type:'organization'}, dates: {created:'2026-04-14T11:00:00.000Z'}, products: [7,5] },

    // ── SCHEDULED ─────────────────────────────────────────────────────────
    { name: 'Tampa Riverwalk Phase 2',       pipeline: 'scheduled', siteId: 3, client: {id:3,type:'organization'}, dates: {created:'2026-02-20T10:00:00.000Z', scheduled:'2026-03-05T08:00:00.000Z'}, products: [3,6] },
    { name: 'Everglades Zone B Mapping',     pipeline: 'scheduled', siteId: 4, client: {id:4,type:'organization'}, dates: {created:'2026-02-25T09:00:00.000Z', scheduled:'2026-03-12T07:30:00.000Z'}, products: [7,8] },
    { name: 'Palm Beach Roof Survey',        pipeline: 'scheduled', siteId: 5, client: {id:5,type:'organization'}, dates: {created:'2026-03-01T10:00:00.000Z', scheduled:'2026-03-22T09:00:00.000Z'}, products: [5] },
    { name: 'Downtown Miami 3D Capture',     pipeline: 'scheduled', siteId: 1, client: {id:1,type:'organization'}, dates: {created:'2026-03-08T10:00:00.000Z', scheduled:'2026-04-08T08:00:00.000Z'}, products: [8,7] },
    { name: 'Sunrise HOA Community Tour',    pipeline: 'scheduled', siteId: 2, client: {id:2,type:'organization'}, dates: {created:'2026-03-15T09:00:00.000Z', scheduled:'2026-04-18T07:00:00.000Z'}, products: [2,4] },

    // ── PROCESSING-DELIVER ────────────────────────────────────────────────
    { name: 'Tampa Construction Update',     pipeline: 'processing-deliver', siteId: 3, client: {id:3,type:'organization'}, dates: {created:'2026-02-10T10:00:00.000Z', scheduled:'2026-03-01T08:00:00.000Z', flown:'2026-03-01T09:30:00.000Z', logged:'2026-03-01T11:00:00.000Z'}, products: [3,6] },
    { name: 'Everglades Aerial Ortho',       pipeline: 'processing-deliver', siteId: 4, client: {id:4,type:'organization'}, dates: {created:'2026-02-14T09:00:00.000Z', scheduled:'2026-03-07T07:00:00.000Z', flown:'2026-03-07T08:15:00.000Z', logged:'2026-03-07T12:00:00.000Z'}, products: [7] },
    { name: 'Orlando Theme Park Video',      pipeline: 'processing-deliver', siteId: 6, client: {id:3,type:'organization'}, dates: {created:'2026-02-18T10:00:00.000Z', scheduled:'2026-03-20T08:00:00.000Z', flown:'2026-03-20T09:00:00.000Z', logged:'2026-03-20T14:00:00.000Z'}, products: [6,4] },
    { name: 'Coastal Office Orthomosaic',    pipeline: 'processing-deliver', siteId: 1, client: {id:1,type:'organization'}, dates: {created:'2026-03-05T09:00:00.000Z', scheduled:'2026-04-03T07:30:00.000Z', flown:'2026-04-03T09:00:00.000Z', logged:'2026-04-03T13:00:00.000Z'}, products: [7,8] },
    { name: 'Santa Monica 3D Survey',        pipeline: 'processing-deliver', siteId: 7, client: {id:4,type:'organization'}, dates: {created:'2026-03-10T10:00:00.000Z', scheduled:'2026-04-10T08:00:00.000Z', flown:'2026-04-10T09:30:00.000Z', logged:'2026-04-10T14:30:00.000Z'}, products: [8,5] },

    // ── BILL ──────────────────────────────────────────────────────────────
    { name: 'Palm Beach Landscape View',     pipeline: 'bill', siteId: 5, client: {id:5,type:'organization'}, dates: {created:'2026-01-20T10:00:00.000Z', scheduled:'2026-02-10T08:00:00.000Z', flown:'2026-02-10T09:00:00.000Z', logged:'2026-02-10T14:00:00.000Z', delivered:'2026-03-02T10:00:00.000Z'}, products: [1,4] },
    { name: 'Sunrise HOA Annual Review',     pipeline: 'bill', siteId: 2, client: {id:2,type:'organization'}, dates: {created:'2026-01-25T09:00:00.000Z', scheduled:'2026-02-15T08:00:00.000Z', flown:'2026-02-15T09:30:00.000Z', logged:'2026-02-15T13:00:00.000Z', delivered:'2026-03-08T10:00:00.000Z'}, products: [2,5] },
    { name: 'Tampa Roof Inspection Set',     pipeline: 'bill', siteId: 3, client: {id:3,type:'organization'}, dates: {created:'2026-02-01T10:00:00.000Z', scheduled:'2026-02-28T08:00:00.000Z', flown:'2026-02-28T10:00:00.000Z', logged:'2026-02-28T15:00:00.000Z', delivered:'2026-03-15T10:00:00.000Z'}, products: [5,6] },
    { name: 'Downtown Miami Progress',       pipeline: 'bill', siteId: 1, client: {id:1,type:'organization'}, dates: {created:'2026-02-10T09:00:00.000Z', scheduled:'2026-03-12T07:30:00.000Z', flown:'2026-03-12T09:00:00.000Z', logged:'2026-03-12T14:00:00.000Z', delivered:'2026-04-01T10:00:00.000Z'}, products: [3,7] },
    { name: 'Everglades Final Deliverable',  pipeline: 'bill', siteId: 4, client: {id:4,type:'organization'}, dates: {created:'2026-02-15T10:00:00.000Z', scheduled:'2026-03-18T07:00:00.000Z', flown:'2026-03-18T08:30:00.000Z', logged:'2026-03-18T13:00:00.000Z', delivered:'2026-04-07T10:00:00.000Z'}, products: [7,8] },

    // ── COMPLETED ─────────────────────────────────────────────────────────
    { name: 'Coastal Q4 Site Summary',       pipeline: 'completed', siteId: 1, client: {id:1,type:'organization'}, dates: {created:'2026-01-10T10:00:00.000Z', scheduled:'2026-02-01T08:00:00.000Z', flown:'2026-02-01T09:00:00.000Z', logged:'2026-02-01T13:00:00.000Z', delivered:'2026-02-15T10:00:00.000Z', billed:'2026-03-04T10:00:00.000Z'}, products: [1,7] },
    { name: 'HOA Winter Documentation',      pipeline: 'completed', siteId: 2, client: {id:2,type:'organization'}, dates: {created:'2026-01-15T09:00:00.000Z', scheduled:'2026-02-05T08:00:00.000Z', flown:'2026-02-05T09:30:00.000Z', logged:'2026-02-05T14:00:00.000Z', delivered:'2026-02-20T10:00:00.000Z', billed:'2026-03-10T10:00:00.000Z'}, products: [2,4] },
    { name: 'Tampa Phase 1 Complete',        pipeline: 'completed', siteId: 3, client: {id:3,type:'organization'}, dates: {created:'2026-01-20T10:00:00.000Z', scheduled:'2026-02-12T08:00:00.000Z', flown:'2026-02-12T09:00:00.000Z', logged:'2026-02-12T14:00:00.000Z', delivered:'2026-02-25T10:00:00.000Z', billed:'2026-03-17T10:00:00.000Z'}, products: [3,6] },
    { name: 'Palm Beach Spring Shoot',       pipeline: 'completed', siteId: 5, client: {id:5,type:'organization'}, dates: {created:'2026-02-01T09:00:00.000Z', scheduled:'2026-03-05T07:30:00.000Z', flown:'2026-03-05T09:00:00.000Z', logged:'2026-03-05T13:30:00.000Z', delivered:'2026-03-20T10:00:00.000Z', billed:'2026-04-02T10:00:00.000Z'}, products: [4,5] },
    { name: 'Orlando Full 3D Package',       pipeline: 'completed', siteId: 6, client: {id:3,type:'organization'}, dates: {created:'2026-02-05T10:00:00.000Z', scheduled:'2026-03-10T08:00:00.000Z', flown:'2026-03-10T09:30:00.000Z', logged:'2026-03-10T15:00:00.000Z', delivered:'2026-03-25T10:00:00.000Z', billed:'2026-04-09T10:00:00.000Z'}, products: [8,7,6] },
    { name: 'Everglades Wetlands Study',     pipeline: 'completed', siteId: 4, client: {id:4,type:'organization'}, dates: {created:'2026-02-08T09:00:00.000Z', scheduled:'2026-03-14T07:00:00.000Z', flown:'2026-03-14T08:30:00.000Z', logged:'2026-03-14T13:00:00.000Z', delivered:'2026-03-28T10:00:00.000Z', billed:'2026-04-15T10:00:00.000Z'}, products: [7,8] },
    { name: 'Santa Monica Coastal Map',      pipeline: 'completed', siteId: 7, client: {id:4,type:'organization'}, dates: {created:'2026-02-12T10:00:00.000Z', scheduled:'2026-03-22T08:00:00.000Z', flown:'2026-03-22T09:00:00.000Z', logged:'2026-03-22T14:00:00.000Z', delivered:'2026-04-05T10:00:00.000Z', billed:'2026-04-20T10:00:00.000Z'}, products: [7,4] },
  ];

  let inserted = 0;
  for (const job of jobs) {
    await conn.execute(
      'INSERT INTO Jobs (pipeline, createdBy, name, client, dates, siteId, products) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        job.pipeline,
        1,
        job.name,
        JSON.stringify(job.client),
        JSON.stringify(job.dates),
        job.siteId,
        JSON.stringify(job.products)
      ]
    );
    inserted++;
    process.stdout.write('.');
  }

  console.log('\nDone! Inserted', inserted, 'jobs.');
  await conn.end();
}

main().catch(console.error);
