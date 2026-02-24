import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";

/**
 * GET /api/products
 * Returns the full product catalog.
 */
export const GET = withAuth(async () => {
  try {
    const rows = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .orderBy(products.id);

    return successResponse(rows);
  } catch (error) {
    console.error("[Products] Error:", error);
    return errorResponse("Failed to fetch products", 500);
  }
});
