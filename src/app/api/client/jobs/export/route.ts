/**
 * GET /api/client/jobs/export
 *
 * Export client's jobs to CSV format
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { jobs, sites, products, jobsMeta } from '@/lib/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { arrayToCSV } from '@/lib/utils/csv-export';

export const GET = withAuth(async (user, request: NextRequest) => {
  try {
    // Get user's organization ID
    const organizationId = user.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Fetch jobs for this organization
    const result = await db
      .select({
        id: jobs.id,
        name: jobs.name,
        pipeline: jobs.pipeline,
        siteName: sites.name,
        dateRequested: jobs.dateRequested,
        dateScheduled: jobs.dateScheduled,
        dateCompleted: jobs.dateCompleted,
        createdAt: jobs.createdAt,
      })
      .from(jobs)
      .leftJoin(sites, eq(jobs.siteId, sites.id))
      .where(eq(jobs.organizationId, organizationId))
      .orderBy(jobs.createdAt);

    // Define columns for CSV
    const columns = [
      { key: 'id' as const, label: 'Job ID' },
      { key: 'name' as const, label: 'Job Name' },
      { key: 'pipeline' as const, label: 'Status' },
      { key: 'siteName' as const, label: 'Site' },
      { key: 'dateRequested' as const, label: 'Date Requested' },
      { key: 'dateScheduled' as const, label: 'Date Scheduled' },
      { key: 'dateCompleted' as const, label: 'Date Completed' },
      { key: 'createdAt' as const, label: 'Created At' },
    ];

    // Convert to CSV
    const csv = arrayToCSV(result, columns);

    // Return CSV file
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
