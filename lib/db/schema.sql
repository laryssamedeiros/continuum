-- Database schema for portable AI memory system

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "pk_live_...")
  name TEXT, -- Optional name for the key
  last_used_at INTEGER,
  created_at INTEGER NOT NULL,
  revoked_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

-- Identity graphs table
CREATE TABLE IF NOT EXISTS identity_graphs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  profile_json TEXT NOT NULL, -- JSON string of the identity graph
  profile_text TEXT, -- Plain text representation
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_identity_graphs_user_id ON identity_graphs(user_id);

-- API usage log for rate limiting
CREATE TABLE IF NOT EXISTS api_usage (
  id TEXT PRIMARY KEY,
  api_key_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_id_created_at ON api_usage(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_api_key_id_created_at ON api_usage(api_key_id, created_at);
