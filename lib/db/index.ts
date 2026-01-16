import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join } from "path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || join(process.cwd(), "data", "continuum.db");

  // Ensure data directory exists
  const { mkdirSync, existsSync } = require("fs");
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  // Initialize schema
  const schemaPath = join(process.cwd(), "lib", "db", "schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");
  db.exec(schema);

  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

// User operations
export interface User {
  id: string;
  email: string;
  created_at: number;
  updated_at: number;
}

export function createUser(id: string, email: string): User {
  const db = getDb();
  const now = Date.now();

  db.prepare(
    "INSERT INTO users (id, email, created_at, updated_at) VALUES (?, ?, ?, ?)"
  ).run(id, email, now, now);

  return { id, email, created_at: now, updated_at: now };
}

export function getUserById(id: string): User | null {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | null;
}

export function getUserByEmail(email: string): User | null {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | null;
}

// API Key operations
export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  key_prefix: string;
  name: string | null;
  last_used_at: number | null;
  created_at: number;
  revoked_at: number | null;
}

export function createApiKey(
  id: string,
  userId: string,
  keyHash: string,
  keyPrefix: string,
  name?: string
): ApiKey {
  const db = getDb();
  const now = Date.now();

  db.prepare(
    "INSERT INTO api_keys (id, user_id, key_hash, key_prefix, name, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, userId, keyHash, keyPrefix, name || null, now);

  return {
    id,
    user_id: userId,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    name: name || null,
    last_used_at: null,
    created_at: now,
    revoked_at: null,
  };
}

export function getApiKeyByHash(keyHash: string): ApiKey | null {
  const db = getDb();
  return db.prepare("SELECT * FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL").get(keyHash) as ApiKey | null;
}

export function getApiKeysByUserId(userId: string): ApiKey[] {
  const db = getDb();
  return db.prepare("SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC").all(userId) as ApiKey[];
}

export function updateApiKeyLastUsed(keyId: string): void {
  const db = getDb();
  db.prepare("UPDATE api_keys SET last_used_at = ? WHERE id = ?").run(Date.now(), keyId);
}

export function revokeApiKey(keyId: string): void {
  const db = getDb();
  db.prepare("UPDATE api_keys SET revoked_at = ? WHERE id = ?").run(Date.now(), keyId);
}

// Identity Graph operations
export interface IdentityGraph {
  id: string;
  user_id: string;
  profile_json: string;
  profile_text: string | null;
  version: number;
  created_at: number;
  updated_at: number;
}

export function saveIdentityGraph(
  userId: string,
  profileJson: any,
  profileText?: string
): IdentityGraph {
  const db = getDb();
  const now = Date.now();

  // Check if user already has a graph
  const existing = db.prepare("SELECT * FROM identity_graphs WHERE user_id = ?").get(userId) as IdentityGraph | null;

  if (existing) {
    // Update existing
    db.prepare(
      "UPDATE identity_graphs SET profile_json = ?, profile_text = ?, version = version + 1, updated_at = ? WHERE user_id = ?"
    ).run(JSON.stringify(profileJson), profileText || null, now, userId);

    return db.prepare("SELECT * FROM identity_graphs WHERE user_id = ?").get(userId) as IdentityGraph;
  } else {
    // Create new
    const { nanoid } = require("nanoid");
    const id = nanoid();

    db.prepare(
      "INSERT INTO identity_graphs (id, user_id, profile_json, profile_text, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, userId, JSON.stringify(profileJson), profileText || null, 1, now, now);

    return { id, user_id: userId, profile_json: JSON.stringify(profileJson), profile_text: profileText || null, version: 1, created_at: now, updated_at: now };
  }
}

export function getIdentityGraphByUserId(userId: string): IdentityGraph | null {
  const db = getDb();
  return db.prepare("SELECT * FROM identity_graphs WHERE user_id = ?").get(userId) as IdentityGraph | null;
}

// API usage logging
export interface ApiUsage {
  id: string;
  api_key_id: string;
  user_id: string;
  endpoint: string;
  created_at: number;
}

export function logApiUsage(apiKeyId: string, userId: string, endpoint: string): void {
  const db = getDb();
  const { nanoid } = require("nanoid");
  const id = nanoid();
  const now = Date.now();

  db.prepare(
    "INSERT INTO api_usage (id, api_key_id, user_id, endpoint, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, apiKeyId, userId, endpoint, now);
}

export function getApiUsageCount(userId: string, since: number): number {
  const db = getDb();
  const result = db.prepare("SELECT COUNT(*) as count FROM api_usage WHERE user_id = ? AND created_at >= ?").get(userId, since) as { count: number };
  return result.count;
}
