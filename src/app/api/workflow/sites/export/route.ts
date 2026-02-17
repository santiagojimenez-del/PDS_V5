/**
 * GET /api/workflow/sites/export
 *
 * Export sites to CSV format
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { sites } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { arrayToCSV } from '@/lib/utils/csv-export';

export const GET = withAuth(async (user, request: NextRequest) => {
  try {
    // Fetch all sites with job count
    const result = await db
      .select({
        id: sites.id,
        name: sites.name,
        description: sites.description,
        address: sites.address,
        city: sites.city,
        state: sites.state,
        zip: sites.zip,
        country: sites.country,
        coordinates: sites.coordinates,
        createdAt: sites.createdAt,
        updatedAt: sites.updatedAt,
      })
      .from(sites)
      .orderBy(sites.name);

    // Format coordinates for CSV
    const formattedData = result.map(site => ({
      ...site,
      coordinates: site.coordinates
        ? (Array.isArray(site.coordinates)
          ? `${site.coordinates[0]}, ${site.coordinates[1]}`
          : JSON.stringify(site.coordinates))
        : '',
    }));

    // Define columns for CSV
    const columns = [
      { key: 'id' as const, label: 'Site ID' },
      { key: 'name' as const, label: 'Site Name' },
      { key: 'description' as const, label: 'Description' },
      { key: 'address' as const, label: 'Address' },
      { key: 'city' as const, label: 'City' },
      { key: 'state' as const, label: 'State' },
      { key: 'zip' as const, label: 'ZIP Code' },
      { key: 'country' as const, label: 'Country' },
      { key: 'coordinates' as const, label: 'Coordinates' },
      { key: 'createdAt' as const, label: 'Created At' },
      { key: 'updatedAt' as const, label: 'Updated At' },
    ];

    // Convert to CSV
    const csv = arrayToCSV(formattedData, columns);

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8;',
        'Content-Disposition': `attachment; filename="sites_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('[Sites Export] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export sites' },
      { status: 500 }
    );
  }
});
