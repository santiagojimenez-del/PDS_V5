/**
 * GET /api/workflow/sites/export
 *
 * Export sites to CSV format
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { sites } from '@/lib/db/schema';
import { arrayToCSV } from '@/lib/utils/csv-export';

export const GET = withAuth(async (user, request: NextRequest) => {
  try {
    // Sites schema: id, createdBy, name, description, address, coordinates, boundary
    const result = await db
      .select({
        id: sites.id,
        name: sites.name,
        description: sites.description,
        address: sites.address,
        coordinates: sites.coordinates,
      })
      .from(sites)
      .orderBy(sites.name);

    // Format coordinates for CSV
    const formattedData = result.map((site) => ({
      ...site,
      coordinates: site.coordinates
        ? Array.isArray(site.coordinates)
          ? `${(site.coordinates as number[])[0]}, ${(site.coordinates as number[])[1]}`
          : JSON.stringify(site.coordinates)
        : '',
    }));

    const columns = [
      { key: 'id' as const, label: 'Site ID' },
      { key: 'name' as const, label: 'Site Name' },
      { key: 'description' as const, label: 'Description' },
      { key: 'address' as const, label: 'Address' },
      { key: 'coordinates' as const, label: 'Coordinates' },
    ];

    const csv = arrayToCSV(formattedData, columns);

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
