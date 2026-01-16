# Continuum API Documentation

**Portable AI Memory for Developers**

Continuum provides a RESTful API for accessing user identity graphs - portable, structured context that travels with users across AI systems.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Identity Graph Schema](#identity-graph-schema)
5. [Integration Examples](#integration-examples)
6. [Rate Limits](#rate-limits)
7. [Error Handling](#error-handling)

---

## Quick Start

### Step 1: Get an API Key

Users generate API keys through the Continuum dashboard:

```bash
# User creates an API key at: https://your-continuum-instance.com
# They'll receive: pk_live_abc123xyz...
```

### Step 2: Make Your First Request

```bash
curl -X GET https://your-continuum-instance.com/api/identity-graph \
  -H "Authorization: Bearer pk_live_abc123xyz..."
```

### Step 3: Use the Identity Graph

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
      "current_focus": ["Building AI agents", "Developer experience"]
    },
    "goals": {
      "short_term": ["Launch AI memory product", "Grow user base to 1000"],
      "long_term": ["Build infrastructure for the AI era", "Enable AI personalization at scale"]
    },
    "skills": ["Python", "TypeScript", "System Design", "Product Strategy"],
    "constraints": ["Limited time", "Bootstrap funding", "Small team"],
    "communication_style": ["Prefers examples over theory", "Values brevity", "Appreciates direct feedback"]
  },
  "version": 3,
  "updated_at": 1705334400000,
  "created_at": 1704729600000
}
```

---

## Authentication

All API requests require authentication via Bearer token in the `Authorization` header.

### Format

```
Authorization: Bearer pk_live_{32_character_key}
```

### Security Notes

- **Never expose API keys in client-side code** - always proxy through your backend
- **Store keys securely** in environment variables or secret managers
- **Rotate keys regularly** and revoke unused keys
- Keys are hashed and cannot be recovered - save them when generated

---

## API Endpoints

### `GET /api/identity-graph`

Retrieves the identity graph for the authenticated user.

**Headers:**
```
Authorization: Bearer pk_live_...
```

**Query Parameters:**
- `format` (optional): `"json"` (default) or `"text"`

**Response (200 OK):**
```json
{
  "profile": { ... },
  "version": 3,
  "updated_at": 1705334400000,
  "created_at": 1704729600000
}
```

**Response (text format):**
```
Content-Type: text/plain
X-Graph-Version: 3
X-Updated-At: 1705334400000

User preferences:
- Name: Alex Chen
- Location: San Francisco, CA
- Preferred tone: direct and technical
...
```

**Errors:**
- `401 Unauthorized` - Missing or invalid API key
- `404 Not Found` - No identity graph exists for this user
- `429 Too Many Requests` - Rate limit exceeded

---

### `POST /api/identity-graph`

Creates or updates the identity graph for the authenticated user.

**Headers:**
```
Authorization: Bearer pk_live_...
Content-Type: application/json
```

**Body:**
```json
{
  "profile": {
    "basic": { ... },
    "preferences": { ... },
    "work": { ... },
    "goals": { ... },
    "skills": [...],
    "constraints": [...],
    "communication_style": [...]
  },
  "profile_text": "Optional plain text representation"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "version": 4,
  "updated_at": 1705338000000,
  "message": "Identity graph saved successfully"
}
```

**Errors:**
- `400 Bad Request` - Invalid JSON or missing `profile` field
- `401 Unauthorized` - Missing or invalid API key
- `429 Too Many Requests` - Rate limit exceeded (50 writes/hour)

---

### `POST /api/keys`

Creates a new API key for a user.

**Body:**
```json
{
  "email": "user@example.com",
  "name": "Production Key"
}
```

**Response (201 Created):**
```json
{
  "api_key": "pk_live_abc123xyz...",
  "key_prefix": "pk_live_abc123x",
  "name": "Production Key",
  "created_at": 1705334400000,
  "message": "IMPORTANT: Save this API key securely. You won't be able to see it again."
}
```

---

### `GET /api/keys`

Lists all API keys for a user (without revealing full keys).

**Query Parameters:**
- `email` (required): User's email address

**Response (200 OK):**
```json
{
  "keys": [
    {
      "id": "key_abc123",
      "key_prefix": "pk_live_abc123x",
      "name": "Production Key",
      "created_at": 1705334400000,
      "last_used_at": 1705420800000,
      "revoked_at": null
    }
  ]
}
```

---

### `DELETE /api/keys`

Revokes an API key.

**Query Parameters:**
- `id` (required): Key ID
- `email` (required): User's email (for verification)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

---

## Identity Graph Schema

The identity graph follows a standardized schema to ensure portability across AI systems.

### Core Structure

```typescript
interface IdentityGraph {
  profile: {
    basic?: {
      name?: string;
      age_range?: string;
      location?: string;
    };
    preferences?: {
      likes?: string[];
      dislikes?: string[];
      tone?: string;
    };
    work?: {
      roles?: string[];
      industries?: string[];
      current_focus?: string[];
    };
    goals?: {
      short_term?: string[];
      long_term?: string[];
    };
    skills?: string[];
    constraints?: string[];
    communication_style?: string[];
  };
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `basic.name` | string | User's name |
| `basic.age_range` | string | Age range (e.g., "25-35") |
| `basic.location` | string | Location (city, state, country) |
| `preferences.likes` | string[] | Topics, interests, preferences |
| `preferences.dislikes` | string[] | Things to avoid |
| `preferences.tone` | string | Preferred communication tone |
| `work.roles` | string[] | Job titles, roles |
| `work.industries` | string[] | Industry domains |
| `work.current_focus` | string[] | Current projects/focus areas |
| `goals.short_term` | string[] | Goals for next 3-6 months |
| `goals.long_term` | string[] | Long-term aspirations |
| `skills` | string[] | Technical and soft skills |
| `constraints` | string[] | Time, budget, resource constraints |
| `communication_style` | string[] | How the user prefers to communicate |

---

## Integration Examples

### Example 1: Personalizing an AI Assistant (Python)

```python
import os
import requests
from openai import OpenAI

# Initialize clients
continuum_api_key = os.environ["CONTINUUM_API_KEY"]
openai_client = OpenAI()

# Fetch user's identity graph
response = requests.get(
    "https://your-continuum-instance.com/api/identity-graph",
    headers={"Authorization": f"Bearer {continuum_api_key}"}
)

identity_graph = response.json()

# Use the graph to personalize AI responses
system_prompt = f"""
You are a personal AI assistant for this user. Here is their identity profile:

{identity_graph}

Use this context to:
- Match their preferred communication tone
- Align with their goals and constraints
- Respect their preferences and dislikes
- Provide relevant examples based on their skills and industry
"""

# Make personalized request
completion = openai_client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "Help me prioritize my work this week"}
    ]
)

print(completion.choices[0].message.content)
```

### Example 2: Building a Personalized Chatbot (TypeScript)

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function getPersonalizedResponse(
  userMessage: string,
  continuumApiKey: string
): Promise<string> {
  // Fetch identity graph
  const graphResponse = await fetch(
    "https://your-continuum-instance.com/api/identity-graph",
    {
      headers: {
        Authorization: `Bearer ${continuumApiKey}`,
      },
    }
  );

  const { profile } = await graphResponse.json();

  // Create personalized system prompt
  const systemPrompt = `
You are assisting a user with the following profile:

Name: ${profile.basic?.name || "Unknown"}
Role: ${profile.work?.roles?.join(", ") || "Unknown"}
Preferred tone: ${profile.preferences?.tone || "neutral"}
Goals: ${profile.goals?.short_term?.join(", ") || "None specified"}

Tailor your responses to their background, goals, and communication preferences.
  `;

  // Get AI response
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `${systemPrompt}\n\nUser question: ${userMessage}`,
      },
    ],
  });

  return message.content[0].text;
}

// Usage
const response = await getPersonalizedResponse(
  "What should I focus on this quarter?",
  process.env.CONTINUUM_API_KEY!
);

console.log(response);
```

### Example 3: Syncing Identity Graph After User Interaction

```typescript
async function updateUserProfile(
  continuumApiKey: string,
  newPreferences: any
) {
  // Fetch current graph
  const currentGraph = await fetch(
    "https://your-continuum-instance.com/api/identity-graph",
    {
      headers: { Authorization: `Bearer ${continuumApiKey}` },
    }
  ).then((r) => r.json());

  // Merge new preferences
  const updatedProfile = {
    ...currentGraph.profile,
    preferences: {
      ...currentGraph.profile.preferences,
      ...newPreferences,
    },
  };

  // Save updated graph
  const response = await fetch(
    "https://your-continuum-instance.com/api/identity-graph",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${continuumApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profile: updatedProfile,
      }),
    }
  );

  return response.json();
}

// Usage
await updateUserProfile(process.env.CONTINUUM_API_KEY!, {
  likes: ["AI agents", "Developer tools", "Automation"],
  tone: "technical and concise",
});
```

### Example 4: Multi-AI Context Sharing

```typescript
// Share the same identity graph across multiple AI providers

async function getContinuumProfile(apiKey: string) {
  const response = await fetch(
    "https://your-continuum-instance.com/api/identity-graph",
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );
  return response.json();
}

async function askMultipleAIs(question: string, continuumApiKey: string) {
  const { profile } = await getContinuumProfile(continuumApiKey);

  const systemPrompt = `User context: ${JSON.stringify(profile, null, 2)}`;

  // Ask OpenAI
  const openaiResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
      }),
    }
  );

  // Ask Claude
  const claudeResponse = await fetch(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          { role: "user", content: `${systemPrompt}\n\n${question}` },
        ],
      }),
    }
  );

  // Both AIs now have the same user context!
  return {
    openai: await openaiResponse.json(),
    claude: await claudeResponse.json(),
  };
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `GET /api/identity-graph` | 100 requests | per hour |
| `POST /api/identity-graph` | 50 requests | per hour |
| `POST /api/keys` | 10 requests | per hour |

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705338000
```

**When Rate Limited (429):**

```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 100 requests per hour allowed",
  "retry_after": 3600
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_REQUEST` | Malformed request body or parameters |
| 401 | `UNAUTHORIZED` | Missing or invalid API key |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error (contact support) |

### Error Handling Example

```typescript
async function safelyFetchGraph(apiKey: string) {
  try {
    const response = await fetch(
      "https://your-continuum-instance.com/api/identity-graph",
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!response.ok) {
      const error = await response.json();

      if (response.status === 429) {
        console.error("Rate limited. Retry after:", error.retry_after);
        // Implement exponential backoff
        return null;
      }

      if (response.status === 404) {
        console.log("User hasn't created an identity graph yet");
        return null;
      }

      throw new Error(`API Error: ${error.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch identity graph:", error);
    return null;
  }
}
```

---

## Support

**Questions?** Open an issue at: https://github.com/your-repo/continuum

**Security Issues?** Email: security@your-domain.com

**Status Page:** https://status.your-domain.com

---

## License

MIT License - See LICENSE file for details
