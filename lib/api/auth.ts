import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import {
  getApiKeyByHash,
  updateApiKeyLastUsed,
  logApiUsage,
  getApiUsageCount,
  ApiKey,
} from "../db";

export interface AuthContext {
  apiKey: ApiKey;
  userId: string;
}

// Generate a new API key
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  // Format: pk_live_[32 random chars]
  const random = nanoid(32);
  const key = `pk_live_${random}`;
  const hash = bcrypt.hashSync(key, 10);
  const prefix = key.substring(0, 15); // "pk_live_" + first 7 chars

  return { key, hash, prefix };
}

// Verify API key from request
export function verifyApiKey(key: string): ApiKey | null {
  if (!key || !key.startsWith("pk_live_")) {
    return null;
  }

  // Hash the provided key and look it up
  // Note: In production, you'd want to optimize this by storing a prefix index
  // For now, we'll do a simple lookup
  try {
    // We need to check all keys since we can't reverse the hash
    // In production, consider using a prefix index or a different approach
    const hash = bcrypt.hashSync(key, 10);

    // Alternative: Store unhashed keys in memory cache for active sessions
    // For now, we'll use a simpler approach with the hash
    return getApiKeyByHash(hash);
  } catch (error) {
    console.error("Error verifying API key:", error);
    return null;
  }
}

// Middleware to authenticate API requests
export async function authenticateRequest(
  request: NextRequest
): Promise<{ success: false; response: NextResponse } | { success: true; context: AuthContext }> {
  // Extract API key from Authorization header
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Missing or invalid Authorization header. Expected: Bearer pk_live_..." },
        { status: 401 }
      ),
    };
  }

  const apiKey = authHeader.substring(7); // Remove "Bearer "

  if (!apiKey.startsWith("pk_live_")) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid API key format. Expected: pk_live_..." },
        { status: 401 }
      ),
    };
  }

  // Look up the key in the database
  // Note: Since bcrypt hashes are one-way, we need a different approach
  // We'll store the key hash and verify it
  const keyRecord = await verifyApiKeyWithDatabase(apiKey);

  if (!keyRecord) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid or revoked API key" },
        { status: 401 }
      ),
    };
  }

  // Update last used timestamp
  updateApiKeyLastUsed(keyRecord.id);

  // Log API usage
  const endpoint = new URL(request.url).pathname;
  logApiUsage(keyRecord.id, keyRecord.user_id, endpoint);

  return {
    success: true,
    context: {
      apiKey: keyRecord,
      userId: keyRecord.user_id,
    },
  };
}

// Helper to verify API key against database
// This uses a comparison approach since bcrypt hashes are non-reversible
async function verifyApiKeyWithDatabase(providedKey: string): Promise<ApiKey | null> {
  // In production, you'd want to optimize this
  // For now, we'll use a simpler approach: store keys with a searchable prefix
  const keyPrefix = providedKey.substring(0, 15); // "pk_live_" + first 7 chars

  // Import the getDb function
  const { getDb } = require("../db");
  const db = getDb();

  // Get all non-revoked keys with this prefix
  const candidates = db
    .prepare("SELECT * FROM api_keys WHERE key_prefix = ? AND revoked_at IS NULL")
    .all(keyPrefix) as ApiKey[];

  // Verify each candidate
  for (const candidate of candidates) {
    if (bcrypt.compareSync(providedKey, candidate.key_hash)) {
      return candidate;
    }
  }

  return null;
}

// Rate limiting check
export function checkRateLimit(userId: string, limitPerHour: number = 100): boolean {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const count = getApiUsageCount(userId, oneHourAgo);
  return count < limitPerHour;
}

// Rate limiting middleware
export async function rateLimitMiddleware(
  request: NextRequest,
  context: AuthContext,
  limitPerHour: number = 100
): Promise<NextResponse | null> {
  if (!checkRateLimit(context.userId, limitPerHour)) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `Maximum ${limitPerHour} requests per hour allowed`,
      },
      { status: 429 }
    );
  }

  return null;
}
