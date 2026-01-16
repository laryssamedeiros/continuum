# Continuum Quick Start Guide

Get up and running with Continuum in 5 minutes.

---

## Prerequisites

- Node.js 18+ installed
- An OpenAI API key (for identity extraction)
- AI chat exports (ChatGPT, Claude, or Gemini)

---

## Setup (5 minutes)

### 1. Clone and Install

```bash
git clone https://github.com/your-username/continuum.git
cd continuum
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-proj-...
```

### 3. Start the Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Usage (3 steps)

### Step 1: Upload Your AI History

1. Go to the dashboard at http://localhost:3000
2. Click "Choose Files" or drag-and-drop
3. Upload your AI chat exports:
   - **ChatGPT**: Settings → Export data → Download ZIP
   - **Claude**: Settings → Export conversations
   - **Gemini**: Google Takeout → Gemini

Wait 30-60 seconds for processing.

### Step 2: Generate an API Key

1. Scroll to "API Key Management"
2. Enter your email address
3. Click "Generate New API Key"
4. **Copy and save the key** (you won't see it again!)

Example key: `pk_live_abc123xyz456def789ghi012jkl345`

### Step 3: Use Your Identity Graph

**Test with curl:**
```bash
curl -X GET http://localhost:3000/api/identity-graph \
  -H "Authorization: Bearer pk_live_your_key_here"
```

**Or use in your app:**
```javascript
const response = await fetch('http://localhost:3000/api/identity-graph', {
  headers: {
    'Authorization': 'Bearer pk_live_your_key_here'
  }
});

const { profile } = await response.json();
console.log(profile);
```

---

## What You Get

Your identity graph contains:

```json
{
  "profile": {
    "basic": {
      "name": "Your Name",
      "location": "Your Location"
    },
    "preferences": {
      "likes": ["AI/ML", "Programming", "..."],
      "dislikes": ["Verbose docs", "..."],
      "tone": "direct and technical"
    },
    "work": {
      "roles": ["Software Engineer", "..."],
      "industries": ["Tech", "..."],
      "current_focus": ["Building X", "..."]
    },
    "goals": {
      "short_term": ["Launch product", "..."],
      "long_term": ["Build company", "..."]
    },
    "skills": ["Python", "JavaScript", "..."],
    "constraints": ["Limited time", "..."],
    "communication_style": ["Prefers examples", "..."]
  }
}
```

---

## Integration Examples

### Example 1: Personalized Chatbot

```typescript
import OpenAI from "openai";

const openai = new OpenAI();

async function chat(userMessage: string, continuumApiKey: string) {
  // Fetch user's identity graph
  const profile = await fetch('http://localhost:3000/api/identity-graph', {
    headers: { Authorization: `Bearer ${continuumApiKey}` }
  }).then(r => r.json());

  // Use it to personalize the AI
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are assisting ${profile.profile.basic.name}.
                  Their preferred tone is ${profile.profile.preferences.tone}.
                  Their goals: ${profile.profile.goals.short_term.join(", ")}`
      },
      { role: "user", content: userMessage }
    ]
  });

  return completion.choices[0].message.content;
}

// Usage
const response = await chat(
  "Help me plan my week",
  "pk_live_your_key_here"
);
console.log(response);
```

### Example 2: Email Draft Generator

```python
import os
import requests
from openai import OpenAI

client = OpenAI()

def draft_email(topic: str, continuum_key: str) -> str:
    # Get user profile
    profile = requests.get(
        "http://localhost:3000/api/identity-graph",
        headers={"Authorization": f"Bearer {continuum_key}"}
    ).json()["profile"]

    # Generate email in their style
    completion = client.chat.completions.create(
        model="gpt-4",
        messages=[{
            "role": "system",
            "content": f"""Draft an email for a user with this profile:
            - Tone: {profile.get('preferences', {}).get('tone', 'professional')}
            - Style: {', '.join(profile.get('communication_style', []))}

            Match their natural writing style."""
        }, {
            "role": "user",
            "content": f"Draft an email about: {topic}"
        }]
    )

    return completion.choices[0].message.content

# Usage
email = draft_email(
    "scheduling a product demo",
    "pk_live_your_key_here"
)
print(email)
```

### Example 3: Code Review Bot

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

async function reviewCode(code: string, continuumApiKey: string) {
  // Fetch user's profile
  const { profile } = await fetch('http://localhost:3000/api/identity-graph', {
    headers: { Authorization: `Bearer ${continuumApiKey}` }
  }).then(r => r.json());

  // Tailor review to their level
  const skills = profile.skills || [];
  const isSenior = skills.some((s: string) =>
    s.toLowerCase().includes('senior') ||
    s.toLowerCase().includes('lead')
  );

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    system: `You're reviewing code for someone with ${isSenior ? 'senior' : 'mid-level'} expertise.
             Skills: ${skills.join(", ")}
             Tone: ${profile.preferences?.tone || "balanced"}

             ${isSenior ? 'Focus on architecture and edge cases.' : 'Explain concepts clearly.'}`,
    messages: [{
      role: "user",
      content: `Review this code:\n\n${code}`
    }]
  });

  return message.content[0].text;
}

// Usage
const review = await reviewCode(`
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
`, "pk_live_your_key_here");

console.log(review);
```

---

## Testing

Run the automated test suite:

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Run tests
npx tsx scripts/test-api.ts
```

Expected output:
```
🧪 Testing Continuum API

✅ API key created successfully
✅ Correctly returned 404 - no graph exists yet
✅ Identity graph created successfully
✅ Identity graph retrieved successfully
✅ Identity graph updated successfully
✅ Text format retrieved successfully
✅ API keys retrieved successfully
✅ Correctly rejected invalid API key

🎉 All tests passed!
```

---

## Common Issues

### "Module not found: better-sqlite3"
```bash
npm install better-sqlite3 --build-from-source
```

### "OpenAI API Error: 429"
You've hit rate limits. Wait a minute or upgrade your OpenAI plan.

### "Failed to create API key"
Make sure the server is running on http://localhost:3000

### Database locked
Restart the server. SQLite can have concurrency issues during development.

---

## Next Steps

- **Read the full API docs**: [README_API.md](./README_API.md)
- **Check integration examples**: [examples/integration-examples.md](./examples/integration-examples.md)
- **Understand the architecture**: [docs/architecture.md](./docs/architecture.md)
- **Build something cool** and share it with the community!

---

## Support

- **Issues**: [GitHub Issues](https://github.com/your-username/continuum/issues)
- **Questions**: [GitHub Discussions](https://github.com/your-username/continuum/discussions)

---

**You're all set!** Start building personalized AI experiences with portable memory.
