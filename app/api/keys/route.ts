import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  createUser,
  getUserByEmail,
  createApiKey,
  getApiKeysByUserId,
  revokeApiKey,
} from "@/lib/db";
import { generateApiKey } from "@/lib/api/auth";

/**
 * POST /api/keys
 *
 * Creates a new API key for a user. If the user doesn't exist, creates one.
 *
 * Body:
 *   {
 *     email: "user@example.com",
 *     name?: "Optional key name"
 *   }
 *
 * Response:
 *   201: {
 *     api_key: "pk_live_...",
 *     key_prefix: "pk_live_abc...",
 *     name: "...",
 *     created_at: number,
 *     message: "IMPORTANT: Save this key..."
 *   }
 */
export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { email, name } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json(
      { error: "Valid email address is required" },
      { status: 400 }
    );
  }

  // Get or create user
  let user = getUserByEmail(email);

  if (!user) {
    const userId = nanoid();
    user = createUser(userId, email);
  }

  // Generate new API key
  const { key, hash, prefix } = generateApiKey();
  const keyId = nanoid();

  createApiKey(keyId, user.id, hash, prefix, name);

  return NextResponse.json(
    {
      api_key: key,
      key_prefix: prefix,
      name: name || null,
      created_at: Date.now(),
      message:
        "IMPORTANT: Save this API key securely. You won't be able to see it again.",
    },
    { status: 201 }
  );
}

/**
 * GET /api/keys
 *
 * Lists all API keys for a user (without revealing the full key).
 *
 * Query params:
 *   email: "user@example.com"
 *
 * Response:
 *   200: {
 *     keys: [
 *       {
 *         id: "...",
 *         key_prefix: "pk_live_abc...",
 *         name: "...",
 *         created_at: number,
 *         last_used_at: number | null,
 *         revoked_at: number | null
 *       }
 *     ]
 *   }
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Email parameter is required" },
      { status: 400 }
    );
  }

  const user = getUserByEmail(email);

  if (!user) {
    return NextResponse.json({ keys: [] });
  }

  const keys = getApiKeysByUserId(user.id);

  // Return keys without sensitive data
  const safeKeys = keys.map((key) => ({
    id: key.id,
    key_prefix: key.key_prefix,
    name: key.name,
    created_at: key.created_at,
    last_used_at: key.last_used_at,
    revoked_at: key.revoked_at,
  }));

  return NextResponse.json({ keys: safeKeys });
}

/**
 * DELETE /api/keys/:id
 *
 * Revokes an API key.
 *
 * Query params:
 *   id: "key_id"
 *   email: "user@example.com" (for verification)
 *
 * Response:
 *   200: { success: true, message: "API key revoked" }
 */
export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const keyId = url.searchParams.get("id");
  const email = url.searchParams.get("email");

  if (!keyId || !email) {
    return NextResponse.json(
      { error: "Both 'id' and 'email' parameters are required" },
      { status: 400 }
    );
  }

  const user = getUserByEmail(email);

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  // Verify the key belongs to this user
  const keys = getApiKeysByUserId(user.id);
  const keyToRevoke = keys.find((k) => k.id === keyId);

  if (!keyToRevoke) {
    return NextResponse.json(
      { error: "API key not found" },
      { status: 404 }
    );
  }

  revokeApiKey(keyId);

  return NextResponse.json({
    success: true,
    message: "API key revoked successfully",
  });
}
