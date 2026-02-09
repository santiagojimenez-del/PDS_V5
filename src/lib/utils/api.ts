import { NextResponse } from "next/server";

/**
 * Return a successful JSON response.
 */
export function successResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

/**
 * Return an error JSON response.
 */
export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

/**
 * Return a 404 Not Found JSON response.
 */
export function notFoundResponse(message = "Not found"): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 404 }
  );
}

/**
 * Return a 401 Unauthorized JSON response.
 */
export function unauthorizedResponse(message = "Unauthorized"): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

/**
 * Return a 403 Forbidden JSON response.
 */
export function forbiddenResponse(message = "Forbidden"): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  );
}
