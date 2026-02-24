/**
 * GET /api/client/jobs/export
 *
 * Export client's jobs to CSV format
 * Filters to jobs where the client's user ID is the job client
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { jobs, sites } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { arrayToCSV } from '@/lib/utils/csv-export';

export const GET = withAuth(async (user, request: NextRequest) => {
  try {
    // Filter jobs that belong to this user (client type = "user" and clientId = user.id)
    const result = await db
      .select({
        id: jobs.id,
        name: jobs.name,
        pipeline: jobs.pipeline,
        siteName: sites.name,
        dateRequested: sql<string>`JSON_UNQUOTE(JSON_EXTRACT(${jobs.dates}, '$.requested'))`,
        dateScheduled: sql<string>`JSON_UNQUOTE(JSON_EXTRACT(${jobs.dates}, '$.scheduled'))`,
        dateCompleted: sql<string>`JSON_UNQUOTE(JSON_EXTRACT(${jobs.dates}, '$.bill_paid'))`,
      })
      .from(jobs)
      .leftJoin(sites, eq(jobs.siteId, sites.id))
      .where(sql`CAST(${jobs.clientId} AS UNSIGNED) = ${user.id}`)
      .orderBy(sql`${jobs.id} DESC`);

    const columns = [
      { key: 'id' as const, label: 'Job ID' },
      { key: 'name' as const, label: 'Job Name' },
      { key: 'pipeline' as const, label: 'Status' },
      { key: 'siteName' as const, label: 'Site' },
      { key: 'dateRequested' as const, label: 'Date Requested' },
      { key: 'dateScheduled' as const, label: 'Date Scheduled' },
      { key: 'dateCompleted' as const, label: 'Date Completed' },
    ];

    const csv = arrayToCSV(result, columns);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8;',
        'Content-Disposition': `attachment; filename="my_jobs_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('[Client Jobs Export] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export jobs' },
      { status: 500 }
    );
  }
});
