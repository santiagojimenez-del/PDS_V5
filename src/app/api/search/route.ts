/**
 * GET /api/search
 *
 * Global search across jobs, sites, organizations, and users
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { jobs, sites, organizations, users } from "@/lib/db/schema";
import { or, like, eq } from "drizzle-orm";

export const GET = withAuth(async (user, request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchPattern = `%${query}%`;
    const results: any[] = [];

    // Search Jobs
    try {
      const jobResults = await db
        .select({
          id: jobs.id,
          name: jobs.name,
          pipeline: jobs.pipeline,
        })
        .from(jobs)
        .where(like(jobs.name, searchPattern))
        .limit(5);

      jobResults.forEach((job) => {
        results.push({
          type: "job",
          id: job.id,
          title: job.name || `Job #${job.id}`,
          subtitle: `Status: ${job.pipeline}`,
          url: `/workflow/jobs`, // Could be more specific with job detail page
        });
      });
    } catch (error) {
      console.error("Job search error:", error);
    }

    // Search Sites
    try {
      const siteResults = await db
        .select({
          id: sites.id,
          name: sites.name,
          address: sites.address,
        })
        .from(sites)
        .where(or(like(sites.name, searchPattern), like(sites.address, searchPattern)))
        .limit(5);

      siteResults.forEach((site) => {
        results.push({
          type: "site",
          id: site.id,
          title: site.name,
          subtitle: site.address || undefined,
          url: `/workflow/sites`,
        });
      });
    } catch (error) {
      console.error("Site search error:", error);
    }

    // Search Organizations (admin only)
    if (user.role === "Admin" || user.role === "Super Admin") {
      try {
        const orgResults = await db
          .select({
            id: organizations.id,
            name: organizations.name,
          })
          .from(organizations)
          .where(like(organizations.name, searchPattern))
          .limit(5);

        orgResults.forEach((org) => {
          results.push({
            type: "organization",
            id: org.id,
            title: org.name,
            subtitle: "Organization",
            url: `/onboard/company/manage`,
          });
        });
      } catch (error) {
        console.error("Organization search error:", error);
      }
    }

    // Search Users (admin only)
    if (user.role === "Admin" || user.role === "Super Admin") {
      try {
        const userResults = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .where(or(like(users.name, searchPattern), like(users.email, searchPattern)))
          .limit(5);

        userResults.forEach((u) => {
          results.push({
            type: "user",
            id: u.id,
            title: u.name || u.email,
            subtitle: u.email,
            url: `/admin/users/${u.id}`,
          });
        });
      } catch (error) {
        console.error("User search error:", error);
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[Global Search] Error:", error);
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 }
    );
  }
});
