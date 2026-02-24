/**
 * GET /api/search
 *
 * Global search across jobs, sites, organizations, and users
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { jobs, sites, organization, users, userMeta } from "@/lib/db/schema";
import { or, like, eq, and, inArray } from "drizzle-orm";

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
          url: `/workflow/jobs`,
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
    if (user.roles.includes(0)) {
      try {
        const orgResults = await db
          .select({
            id: organization.id,
            name: organization.name,
          })
          .from(organization)
          .where(like(organization.name, searchPattern))
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

    // Search Users by email + name from User_Meta (admin only)
    if (user.roles.includes(0)) {
      try {
        const userResults = await db
          .select({ id: users.id, email: users.email })
          .from(users)
          .where(like(users.email, searchPattern))
          .limit(5);

        // Fetch first_name meta for matched users
        const userIds = userResults.map((u) => u.id);
        const nameMeta =
          userIds.length > 0
            ? await db
                .select({ uid: userMeta.uid, metaKey: userMeta.metaKey, metaValue: userMeta.metaValue })
                .from(userMeta)
                .where(
                  and(
                    inArray(userMeta.uid, userIds),
                    or(eq(userMeta.metaKey, "first_name"), eq(userMeta.metaKey, "last_name"))
                  )
                )
            : [];

        const nameMap: Record<number, { first?: string; last?: string }> = {};
        for (const m of nameMeta) {
          if (!nameMap[m.uid]) nameMap[m.uid] = {};
          if (m.metaKey === "first_name") nameMap[m.uid].first = m.metaValue || "";
          if (m.metaKey === "last_name") nameMap[m.uid].last = m.metaValue || "";
        }

        userResults.forEach((u) => {
          const fullName = [nameMap[u.id]?.first, nameMap[u.id]?.last].filter(Boolean).join(" ");
          results.push({
            type: "user",
            id: u.id,
            title: fullName || u.email,
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
