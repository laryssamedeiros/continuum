# Continuum Architecture

Technical overview of how Continuum works.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  (Next.js App - Upload, Dashboard, API Key Management)  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   API Layer (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  /api/keys   │  │ /api/identity│  │/api/upload   │  │
│  │  (Key Mgmt)  │  │    -graph    │  │  -files      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│               Authentication Middleware                  │
│         (Bearer token verification, rate limiting)       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Database Layer (SQLite)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  users   │  │ api_keys │  │ identity │  │   api   │ │
│  │          │  │          │  │  graphs  │  │  usage  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│            AI Processing (OpenAI GPT-4)                  │
│  (Extract identity context from chat conversations)      │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. User Uploads AI Chat History

```
User → Upload ZIP/JSON → Parse Files → Detect Format
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │  ChatGPT?    │
                                    │  Claude?     │
                                    │  Gemini?     │
                                    └──────────────┘
                                           │
                                           ▼
                              Extract Conversations (text)
```

### 2. Identity Graph Extraction

```
Conversation Text → Chunk into ~2000 tokens → Send to GPT-4
                                                    │
                                                    ▼
                                         GPT-4 analyzes each chunk
                                         and extracts:
                                         - Preferences
                                         - Goals
                                         - Skills
                                         - Work context
                                         - Communication style
                                                    │
                                                    ▼
                                         Merge all chunks
                                                    │
                                                    ▼
                                       Generate final identity graph
                                       (Structured JSON)
```

### 3. API Access by Developers

```
Developer App → API Request with Bearer token
                      │
                      ▼
            Verify API key in database
                      │
                      ▼
            Check rate limit (usage log)
                      │
                      ▼
            Fetch identity graph for user
                      │
                      ▼
            Return JSON profile
                      │
                      ▼
      Developer uses profile to personalize AI
```

---

## Database Schema

### Tables

#### `users`
Stores user accounts (email-based, no passwords).

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PRIMARY KEY) | User ID (nanoid) |
| `email` | TEXT (UNIQUE) | User's email address |
| `created_at` | INTEGER | Unix timestamp |
| `updated_at` | INTEGER | Unix timestamp |

#### `api_keys`
Stores API keys with secure hashing.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PRIMARY KEY) | Key ID (nanoid) |
| `user_id` | TEXT (FOREIGN KEY) | References users(id) |
| `key_hash` | TEXT | bcrypt hash of the full key |
| `key_prefix` | TEXT | First 15 chars (e.g., "pk_live_abc123x") |
| `name` | TEXT | Optional key name |
| `last_used_at` | INTEGER | Last usage timestamp |
| `created_at` | INTEGER | Creation timestamp |
| `revoked_at` | INTEGER | Revocation timestamp (null if active) |

**Why hash keys?**
- Full keys are never stored in plain text
- If database is compromised, keys can't be stolen
- bcrypt makes brute-forcing infeasible

**Key Format:**
```
pk_live_[32 random characters]
Example: pk_live_abc123xyz456def789ghi012jkl345
```

#### `identity_graphs`
Stores the structured identity graphs.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PRIMARY KEY) | Graph ID (nanoid) |
| `user_id` | TEXT (FOREIGN KEY) | References users(id) |
| `profile_json` | TEXT | JSON string of the identity graph |
| `profile_text` | TEXT | Plain text representation (optional) |
| `version` | INTEGER | Version number (increments on updates) |
| `created_at` | INTEGER | Creation timestamp |
| `updated_at` | INTEGER | Last update timestamp |

**One graph per user** - Updates replace the previous version.

#### `api_usage`
Logs API requests for rate limiting.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PRIMARY KEY) | Log ID (nanoid) |
| `api_key_id` | TEXT (FOREIGN KEY) | References api_keys(id) |
| `user_id` | TEXT (FOREIGN KEY) | References users(id) |
| `endpoint` | TEXT | API endpoint (e.g., "/api/identity-graph") |
| `created_at` | INTEGER | Request timestamp |

**Rate Limiting:**
- Count requests per user in the last hour
- Read limit: 100 requests/hour
- Write limit: 50 requests/hour

---

## Identity Graph Schema

The standardized schema for portable AI memory.

### JSON Structure

```typescript
interface IdentityGraph {
  profile: {
    basic?: {
      name?: string;
      age_range?: string; // e.g., "25-35"
      location?: string;  // e.g., "San Francisco, CA"
    };
    preferences?: {
      likes?: string[];     // Topics, interests
      dislikes?: string[];  // Things to avoid
      tone?: string;        // e.g., "direct and technical"
    };
    work?: {
      roles?: string[];           // e.g., ["Software Engineer", "Founder"]
      industries?: string[];      // e.g., ["AI/ML", "SaaS"]
      current_focus?: string[];   // Current projects
    };
    goals?: {
      short_term?: string[];  // 3-6 month goals
      long_term?: string[];   // 1-3 year goals
    };
    skills?: string[];              // Technical and soft skills
    constraints?: string[];         // Time, budget, resource constraints
    communication_style?: string[]; // How they prefer to communicate
  };
}
```

### Example

```json
{
  "profile": {
    "basic": {
      "name": "Alex Chen",
      "age_range": "25-35",
      "location": "San Francisco, CA"
    },
    "preferences": {
      "likes": ["AI/ML", "Developer tools", "Productivity"],
      "dislikes": ["Verbose explanations", "Marketing speak"],
      "tone": "direct and technical"
    },
    "work": {
      "roles": ["Software Engineer", "Startup Founder"],
      "industries": ["Developer Tools", "AI Infrastructure"],
      "current_focus": ["Building AI memory system", "User acquisition"]
    },
    "goals": {
      "short_term": ["Launch beta product", "Get first 100 users"],
      "long_term": ["Build infrastructure for AI era", "Enable personalization at scale"]
    },
    "skills": ["Python", "TypeScript", "System Design", "AI/ML"],
    "constraints": ["Limited time", "Bootstrap funding", "Small team"],
    "communication_style": [
      "Prefers examples over theory",
      "Values brevity",
      "Appreciates direct feedback"
    ]
  }
}
```

---

## AI Extraction Pipeline

### Step 1: Parse Chat Exports

Different AI providers have different export formats:

**ChatGPT:**
```json
{
  "title": "Conversation Title",
  "mapping": {
    "id1": {
      "message": {
        "author": { "role": "user" },
        "content": { "parts": ["User message"] }
      }
    },
    "id2": {
      "message": {
        "author": { "role": "assistant" },
        "content": { "parts": ["AI response"] }
      }
    }
  }
}
```

**Claude:**
```json
{
  "uuid": "conv-123",
  "chat_messages": [
    {
      "uuid": "msg-1",
      "sender": "human",
      "text": "User message"
    },
    {
      "uuid": "msg-2",
      "sender": "assistant",
      "text": "AI response"
    }
  ]
}
```

**Gemini:**
```json
{
  "conversation_id": "conv-abc",
  "turns": [
    {
      "role": "user",
      "content": "User message"
    },
    {
      "role": "model",
      "content": "AI response"
    }
  ]
}
```

We normalize all of these into:
```typescript
interface Conversation {
  id: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}
```

### Step 2: Chunk Conversations

To avoid token limits, we chunk conversations:

```typescript
function chunkText(text: string, chunkSize: number = 2000): string[] {
  // Split into sentences
  // Group sentences into chunks under chunkSize tokens
  // Return array of chunks
}
```

### Step 3: Extract Identity from Each Chunk

For each chunk, we call GPT-4 with this prompt:

```
You are analyzing a conversation to extract identity traits.

Conversation:
[chunk text]

Extract:
1. Basic info (name, age range, location)
2. Preferences (likes, dislikes, tone)
3. Work (roles, industries, current focus)
4. Goals (short-term, long-term)
5. Skills
6. Constraints
7. Communication style

Return as JSON.
```

### Step 4: Merge All Chunks

After processing all chunks, we merge the results:

```typescript
function mergeProfiles(profiles: IdentityGraph[]): IdentityGraph {
  // Combine arrays (deduplicate)
  // Keep most specific values for strings
  // Return merged profile
}
```

---

## API Authentication Flow

### Creating an API Key

```
1. User provides email
2. System checks if user exists
   - If not, create new user
3. Generate API key: pk_live_[32 random chars]
4. Hash key with bcrypt
5. Store hash + prefix in database
6. Return full key to user (only time they see it)
```

### Verifying an API Key

```
1. Extract "Bearer pk_live_..." from Authorization header
2. Look up keys by prefix in database
3. Compare provided key with stored hashes using bcrypt
4. If match found:
   - Update last_used_at
   - Log request to api_usage
   - Allow request
5. If no match:
   - Return 401 Unauthorized
```

### Rate Limiting

```
1. Count requests in api_usage table
   WHERE user_id = ? AND created_at >= (now - 1 hour)
2. If count >= limit:
   - Return 429 Too Many Requests
3. Otherwise:
   - Process request
   - Log to api_usage
```

---

## Security Considerations

### API Key Storage
- **Never store keys in plain text**
- Use bcrypt with salt (cost factor 10)
- Store key prefix for efficient lookup
- Keys are 32 characters from nanoid (256-bit entropy)

### Rate Limiting
- Per-user, not per-key (prevents key rotation attacks)
- Separate limits for reads vs writes
- Cleans up old logs periodically

### Database
- SQLite with WAL mode for concurrent reads
- Foreign key constraints enforced
- Indexes on frequently queried columns

### CORS
- Restrict API access to trusted origins
- Require Authorization header (not query params)
- No API keys in URLs (prevents logging/referer leaks)

---

## Scalability

### Current Limitations (SQLite)
- Single-server deployment
- Concurrent writes can block
- No horizontal scaling

### Future: PostgreSQL Migration
For production at scale:

```sql
-- Same schema, but with PostgreSQL features:
-- - Better concurrency (MVCC)
-- - Replication for HA
-- - Connection pooling
-- - Full-text search on conversations
```

### Caching Layer
Add Redis for:
- Rate limit counters (faster than DB queries)
- Frequently accessed identity graphs
- API key validation cache

### CDN / Edge
Serve static assets via CDN:
- Dashboard UI
- Documentation
- Integration examples

---

## Deployment Options

### Option 1: VPS (Recommended for SQLite)
- Single server (DigitalOcean, Linode, etc.)
- PM2 for process management
- nginx for reverse proxy
- Let's Encrypt for SSL

### Option 2: Vercel + PostgreSQL
- Serverless functions (no SQLite support)
- Use Supabase or Neon for PostgreSQL
- Edge runtime for low latency

### Option 3: Docker + Fly.io
- Containerized deployment
- Persistent volumes for SQLite
- Multi-region deployment

---

## Monitoring

### Key Metrics
- API request rate (per endpoint)
- Error rate (4xx, 5xx)
- Response time (p50, p95, p99)
- Database size
- Active API keys

### Logging
- Structured JSON logs
- Log API errors for debugging
- Don't log full API keys (only prefixes)

### Alerts
- High error rate (>5%)
- Database size exceeding threshold
- Unusual API usage patterns

---

## Future Enhancements

### OAuth Integration
Allow third-party apps to request access:

```
1. User authorizes app in Continuum dashboard
2. App receives access token
3. App calls /api/identity-graph with token
4. User can revoke access anytime
```

### Selective Sharing
Let users share only parts of their graph:

```json
{
  "shared_fields": ["preferences", "skills"],
  "hidden_fields": ["basic.location", "goals"]
}
```

### Graph Versioning
Track changes over time:

```sql
CREATE TABLE identity_graph_history (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  profile_json TEXT,
  version INTEGER,
  created_at INTEGER
);
```

### Real-Time Sync
Auto-update graphs as users chat:
- Browser extension captures new conversations
- Incremental updates via PATCH endpoint
- Conflict resolution for concurrent edits

---

## Contributing

To modify the architecture:

1. Update this document with the proposed changes
2. Discuss in GitHub Issues or Discussions
3. Implement changes with tests
4. Update API documentation if endpoints change

---

## Questions?

Open an issue or discussion on GitHub!
