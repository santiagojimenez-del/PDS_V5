import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { permissions } from "@/lib/db/schema";
import { withRole } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/utils/api";
import { ROLES } from "@/lib/constants";

export const GET = withRole([ROLES.ADMIN], async (_user, _req: NextRequest) => {
  const rows = await db
    .select()
    .from(permissions)
    .orderBy(permissions.category, permissions.priority);

  const enriched = rows.map((p) => ({
    name: p.name,
    category: p.category,
    label: p.label,
    description: p.description,
    priority: p.priority,
    hidden: p.hidden === 1,
    enforce: p.enforce === 1,
  }));

  // Group by category
  const categories: Record<string, typeof enriched> = {};
  for (const p of enriched) {
    const cat = p.category || "Uncategorized";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(p);
  }

  return successResponse({ permissions: enriched, categories, total: enriched.length });
});
