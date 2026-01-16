import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, rateLimitMiddleware } from "@/lib/api/auth";
import { getIdentityGraphByUserId, saveIdentityGraph } from "@/lib/db";

/**
 * GET /api/identity-graph
 *
 * Retrieves the identity graph for the authenticated user.
 *
 * Headers:
 *   Authorization: Bearer pk_live_...
 *
 * Query params:
 *   format: "json" | "text" (default: "json")
 *
 * Response:
 *   200: { profile: {...}, version: number, updated_at: number }
 *   401: { error: "..." }
 *   404: { error: "No identity graph found" }
 *   429: { error: "Rate limit exceeded" }
 */
export async function GET(request: NextRequest) {
  // Authenticate the request
  const authResult = await authenticateRequest(request);

  if (!authResult.success) {
    return authResult.response;
  }

  const { context } = authResult;

  // Check rate limit
  const rateLimitResponse = await rateLimitMiddleware(request, context);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Get the identity graph
  const graph = getIdentityGraphByUserId(context.userId);

  if (!graph) {
    return NextResponse.json(
      { error: "No identity graph found for this user" },
      { status: 404 }
    );
  }

  // Check format preference
  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "json";

  if (format === "text" && graph.profile_text) {
    return new NextResponse(graph.profile_text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "X-Graph-Version": graph.version.toString(),
        "X-Updated-At": graph.updated_at.toString(),
      },
    });
  }

  // Return JSON format
  const profileJson = JSON.parse(graph.profile_json);

  return NextResponse.json({
    profile: profileJson,
    version: graph.version,
    updated_at: graph.updated_at,
    created_at: graph.created_at,
  });
}

/**
 * POST /api/identity-graph
 *
 * Creates or updates the identity graph for the authenticated user.
 *
 * Headers:
 *   Authorization: Bearer pk_live_...
 *   Content-Type: application/json
 *
 * Body:
 *   {
 *     profile: { ... identity graph JSON ... },
 *     profile_text?: "optional plain text representation"
 *   }
 *
 * Response:
 *   200: { success: true, version: number, updated_at: number }
 *   400: { error: "..." }
 *   401: { error: "..." }
 *   429: { error: "Rate limit exceeded" }
 */
export async function POST(request: NextRequest) {
  // Authenticate the request
  const authResult = await authenticateRequest(request);

  if (!authResult.success) {
    return authResult.response;
  }

  const { context } = authResult;

  // Check rate limit (stricter for writes)
  const rateLimitResponse = await rateLimitMiddleware(request, context, 50);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  // Validate the profile data
  if (!body.profile || typeof body.profile !== "object") {
    return NextResponse.json(
      { error: "Missing or invalid 'profile' field in request body" },
      { status: 400 }
    );
  }

  // Save the identity graph
  const graph = saveIdentityGraph(
    context.userId,
    body.profile,
    body.profile_text || null
  );

  return NextResponse.json({
    success: true,
    version: graph.version,
    updated_at: graph.updated_at,
    message: "Identity graph saved successfully",
  });
}

/**
 * PUT /api/identity-graph
 *
 * Alias for POST (idempotent update)
 */
export async function PUT(request: NextRequest) {
  return POST(request);
}
