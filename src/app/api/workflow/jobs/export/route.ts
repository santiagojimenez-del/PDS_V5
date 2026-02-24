/**
 * GET /api/workflow/jobs/export
 *
 * Export jobs to CSV format
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { jobs, sites, organization } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { arrayToCSV } from '@/lib/utils/csv-export';

export const GET = withAuth(async (user, request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pipeline = searchParams.get('pipeline');

    // Build query - dates are stored as JSON: { requested, scheduled, bill_paid, ... }
    let query = db
      .select({
        id: jobs.id,
        name: jobs.name,
        pipeline: jobs.pipeline,
        siteName: sites.name,
        clientName: organization.name,
        dateRequested: sql<string>`JSON_UNQUOTE(JSON_EXTRACT(${jobs.dates}, '$.requested'))`,
        dateScheduled: sql<string>`JSON_UNQUOTE(JSON_EXTRACT(${jobs.dates}, '$.scheduled'))`,
        dateCompleted: sql<string>`JSON_UNQUOTE(JSON_EXTRACT(${jobs.dates}, '$.bill_paid'))`,
      })
      .from(jobs)
      .leftJoin(sites, eq(jobs.siteId, sites.id))
      .leftJoin(organization, eq(sql`CAST(${jobs.clientId} AS UNSIGNED)`, organization.id));

    if (pipeline) {
      query = query.where(eq(jobs.pipeline, pipeline)) as typeof query;
    }

    const result = await query;

    const columns = [
      { key: 'id' as const, label: 'Job ID' },
      { key: 'name' as const, label: 'Job Name' },
      { key: 'pipeline' as const, label: 'Status' },
      { key: 'clientName' as const, label: 'Client' },
      { key: 'siteName' as const, label: 'Site' },
      { key: 'dateRequested' as const, label: 'Date Requested' },
      { key: 'dateScheduled' as const, label: 'Date Scheduled' },
      { key: 'dateCompleted' as const, label: 'Date Completed' },
    ];

    const csv = arrayToCSV(result, columns);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8;',
        'Content-Disposition': `attachment; filename="jobs_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('[Jobs Export] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export jobs' },
      { status: 500 }
    );
  }
});
