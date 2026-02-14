import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

// GET /api/tiles/{z}/{x}/{y}.png - Serve tile images
// No auth required (already in SKIP_PREFIXES in middleware)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  if (!pathSegments || pathSegments.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const tilePath = pathSegments.join("/");

  // Security: prevent directory traversal
  if (tilePath.includes("..") || tilePath.includes("~")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // In dev, serve from public/tiles/
  // In prod, this would proxy to CDN
  const fullPath = join(process.cwd(), "public", "tiles", tilePath);

  try {
    const buffer = await readFile(fullPath);

    // Determine content type from extension
    const ext = tilePath.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "png" ? "image/png" :
      ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
      ext === "webp" ? "image/webp" :
      "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    // Tile not found - return transparent 1x1 PNG
    const transparentPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRElFTkSuQmCC",
      "base64"
    );
    return new NextResponse(transparentPng, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
}
