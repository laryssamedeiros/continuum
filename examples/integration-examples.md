# Continuum Integration Examples

Real-world examples of integrating portable AI memory into your applications.

---

## Table of Contents

1. [AI Chatbot with Memory](#ai-chatbot-with-memory)
2. [Email Assistant](#email-assistant)
3. [Content Generation Tool](#content-generation-tool)
4. [Code Review Assistant](#code-review-assistant)
5. [Meeting Summarizer](#meeting-summarizer)
6. [Custom GPT Integration](#custom-gpt-integration)

---

## AI Chatbot with Memory

Build a chatbot that remembers user preferences across sessions.

### Backend (Node.js + Express)

```typescript
import express from "express";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
const anthropic = new Anthropic();

app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { message, continuumApiKey } = req.body;

  // Fetch user's identity graph
  const graphResponse = await fetch(
    `${process.env.CONTINUUM_API_URL}/api/identity-graph`,
    {
      headers: { Authorization: `Bearer ${continuumApiKey}` },
    }
  );

  if (!graphResponse.ok) {
    return res.status(401).json({ error: "Invalid Continuum API key" });
  }

  const { profile } = await graphResponse.json();

  // Build context-aware system prompt
  const systemContext = `
You are chatting with ${profile.basic?.name || "a user"}.

Context about them:
- Location: ${profile.basic?.location || "Unknown"}
- Role: ${profile.work?.roles?.join(", ") || "Unknown"}
- Current focus: ${profile.work?.current_focus?.join(", ") || "Unknown"}
- Goals: ${profile.goals?.short_term?.join(", ") || "Unknown"}
- Communication style: ${profile.communication_style?.join(", ") || "Unknown"}
- Likes: ${profile.preferences?.likes?.join(", ") || "Unknown"}
- Dislikes: ${profile.preferences?.dislikes?.join(", ") || "Unknown"}

Adapt your responses to their background and preferences. Use their preferred tone: ${profile.preferences?.tone || "neutral"}.
  `.trim();

  // Get AI response
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    system: systemContext,
    messages: [{ role: "user", content: message }],
  });

  res.json({
    response: response.content[0].text,
    context_used: {
      name: profile.basic?.name,
      tone: profile.preferences?.tone,
      goals: profile.goals?.short_term,
    },
  });
});

app.listen(3000, () => {
  console.log("Chatbot server running on port 3000");
});
```

### Frontend (React)

```tsx
import { useState } from "react";

export default function ChatbotWithMemory() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [continuumKey, setContinuumKey] = useState("");

  const sendMessage = async () => {
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input,
        continuumApiKey: continuumKey,
      }),
    });

    const data = await response.json();

    const assistantMessage = {
      role: "assistant",
      content: data.response,
      context: data.context_used,
    };

    setMessages((prev) => [...prev, assistantMessage]);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>AI Chat with Memory</h2>
        <input
          type="password"
          placeholder="Continuum API Key"
          value={continuumKey}
          onChange={(e) => setContinuumKey(e.target.value)}
        />
      </div>

      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <p>{msg.content}</p>
            {msg.context && (
              <div className="context-badge">
                Using context: {msg.context.name}, {msg.context.tone}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
```

---

## Email Assistant

Automatically draft emails in the user's style.

```python
import os
import requests
from openai import OpenAI

client = OpenAI()

def get_user_profile(continuum_api_key):
    """Fetch user's identity graph from Continuum."""
    response = requests.get(
        f"{os.environ['CONTINUUM_API_URL']}/api/identity-graph",
        headers={"Authorization": f"Bearer {continuum_api_key}"}
    )
    return response.json()

def draft_email(
    recipient: str,
    purpose: str,
    key_points: list[str],
    continuum_api_key: str
) -> str:
    """Draft an email in the user's communication style."""

    # Get user profile
    profile = get_user_profile(continuum_api_key)["profile"]

    # Build style guide from profile
    style_guide = f"""
User's communication style:
- Tone: {profile.get("preferences", {}).get("tone", "professional")}
- Name: {profile.get("basic", {}).get("name", "User")}
- Role: {", ".join(profile.get("work", {}).get("roles", []))}
- Communication preferences: {", ".join(profile.get("communication_style", []))}
- Dislikes: {", ".join(profile.get("preferences", {}).get("dislikes", []))}

Draft an email that matches this user's natural writing style.
    """.strip()

    # Generate draft
    completion = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": style_guide},
            {
                "role": "user",
                "content": f"""
Draft an email to {recipient} about {purpose}.

Key points to cover:
{chr(10).join(f"- {point}" for point in key_points)}

Match my communication style and tone based on the profile you have.
                """.strip()
            }
        ]
    )

    return completion.choices[0].message.content

# Usage
email_draft = draft_email(
    recipient="john@startup.com",
    purpose="scheduling a product demo",
    key_points=[
        "We've built a new AI memory layer",
        "Would love to show you how it works",
        "Looking for 30 min next week"
    ],
    continuum_api_key=os.environ["CONTINUUM_API_KEY"]
)

print(email_draft)
```

**Output (for a user with "direct and casual" tone):**

```
Hey John,

Quick one - we just built this new AI memory layer and I think you'd find it interesting.

Basically, it lets users take their AI context with them across different tools. No more repeating yourself to every new AI assistant.

Got 30 min next week to walk you through a demo? I can show you exactly how it works.

Let me know!
```

---

## Content Generation Tool

Generate blog posts, docs, or social media content that matches the user's voice.

```typescript
import Anthropic from "@anthropic-ai/sdk";

interface ContentRequest {
  topic: string;
  format: "blog-post" | "twitter-thread" | "linkedin-post";
  length: "short" | "medium" | "long";
  continuumApiKey: string;
}

async function generateContent(request: ContentRequest): Promise<string> {
  const anthropic = new Anthropic();

  // Fetch user's identity graph
  const graphResponse = await fetch(
    `${process.env.CONTINUUM_API_URL}/api/identity-graph`,
    {
      headers: { Authorization: `Bearer ${request.continuumApiKey}` },
    }
  );

  const { profile } = await graphResponse.json();

  // Build writing style guide
  const styleGuide = `
You are ghostwriting for ${profile.basic?.name || "this user"}.

Their voice:
- Tone: ${profile.preferences?.tone || "professional"}
- Communication style: ${profile.communication_style?.join(", ") || "clear and concise"}
- Topics they care about: ${profile.preferences?.likes?.join(", ") || "various"}
- Things they avoid: ${profile.preferences?.dislikes?.join(", ") || "none specified"}

Their background:
- Role: ${profile.work?.roles?.join(", ") || "Unknown"}
- Industry: ${profile.work?.industries?.join(", ") || "Unknown"}
- Current focus: ${profile.work?.current_focus?.join(", ") || "Unknown"}

Write in THEIR voice, not yours. Match their style, tone, and expertise level.
  `.trim();

  const formatInstructions = {
    "blog-post": "Write a blog post with an engaging title, introduction, body sections, and conclusion.",
    "twitter-thread": "Write a Twitter thread (max 10 tweets, 280 chars each). Start with a hook.",
    "linkedin-post": "Write a LinkedIn post that's professional yet engaging. Include relevant hashtags.",
  };

  const lengthGuide = {
    short: "Keep it brief - 200-300 words",
    medium: "Standard length - 500-700 words",
    long: "Comprehensive - 1000-1500 words",
  };

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    system: styleGuide,
    messages: [
      {
        role: "user",
        content: `
Topic: ${request.topic}

Format: ${formatInstructions[request.format]}

Length: ${lengthGuide[request.length]}

Write this content in my voice, matching my tone and style.
        `.trim(),
      },
    ],
  });

  return message.content[0].text;
}

// Usage
const blogPost = await generateContent({
  topic: "Why AI memory needs to be portable",
  format: "blog-post",
  length: "medium",
  continuumApiKey: process.env.CONTINUUM_API_KEY!,
});

console.log(blogPost);
```

---

## Code Review Assistant

Provide code reviews tailored to the user's expertise level and preferences.

```python
import os
import requests
from anthropic import Anthropic

def review_code(code: str, language: str, continuum_api_key: str) -> str:
    """Generate a code review personalized to the user's level."""

    # Fetch user profile
    profile_response = requests.get(
        f"{os.environ['CONTINUUM_API_URL']}/api/identity-graph",
        headers={"Authorization": f"Bearer {continuum_api_key}"}
    )
    profile = profile_response.json()["profile"]

    # Determine user's expertise
    skills = profile.get("skills", [])
    is_senior = any(
        skill.lower() in ["senior", "lead", "architect", "principal"]
        for skill in skills
    )

    # Build review context
    context = f"""
You are reviewing code for:
- Skills: {", ".join(skills)}
- Experience level: {"Senior/Expert" if is_senior else "Mid-level"}
- Communication preference: {profile.get("preferences", {}).get("tone", "balanced")}
- Values: {", ".join(profile.get("communication_style", []))}

Tailor your review to their level:
- {"Focus on architecture, scalability, and subtle edge cases" if is_senior else "Explain concepts clearly, focus on best practices"}
- Match their preferred communication style
    """.strip()

    client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2048,
        system=context,
        messages=[{
            "role": "user",
            "content": f"Review this {language} code:\n\n```{language}\n{code}\n```"
        }]
    )

    return message.content[0].text

# Example usage
code_sample = """
def process_payments(payments):
    total = 0
    for payment in payments:
        if payment['status'] == 'pending':
            total += payment['amount']
    return total
"""

review = review_code(
    code=code_sample,
    language="python",
    continuum_api_key=os.environ["CONTINUUM_API_KEY"]
)

print(review)
```

**For a senior engineer with "direct" communication style:**

```
Issues:

1. No error handling for missing keys - will crash on malformed payment dicts
2. Mutating state (total) in a loop - prefer functional approach with sum()
3. No type hints - makes the function contract unclear
4. Magic string 'pending' should be an enum or constant

Suggested refactor:

```python
from typing import TypedDict, Literal

PaymentStatus = Literal["pending", "completed", "failed"]

class Payment(TypedDict):
    status: PaymentStatus
    amount: float

def process_payments(payments: list[Payment]) -> float:
    return sum(
        p["amount"]
        for p in payments
        if p.get("status") == "pending"
    )
```

This is more Pythonic, type-safe, and handles missing fields gracefully.
```

---

## Meeting Summarizer

Summarize meetings with action items relevant to the user's role.

```typescript
import OpenAI from "openai";

interface MeetingSummaryRequest {
  transcript: string;
  attendees: string[];
  continuumApiKey: string;
}

async function summarizeMeeting(
  request: MeetingSummaryRequest
): Promise<string> {
  const openai = new OpenAI();

  // Fetch user profile
  const profileResponse = await fetch(
    `${process.env.CONTINUUM_API_URL}/api/identity-graph`,
    {
      headers: { Authorization: `Bearer ${request.continuumApiKey}` },
    }
  );

  const { profile } = await profileResponse.json();

  // Build personalized context
  const context = `
You are summarizing a meeting for ${profile.basic?.name || "this user"}.

Their role: ${profile.work?.roles?.join(", ") || "Unknown"}
Their focus areas: ${profile.work?.current_focus?.join(", ") || "Unknown"}
Their goals: ${profile.goals?.short_term?.join(", ") || "Unknown"}

In your summary:
1. Highlight action items RELEVANT TO THEM based on their role and goals
2. Emphasize topics related to their current focus areas
3. Use their preferred tone: ${profile.preferences?.tone || "professional"}
  `.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: context },
      {
        role: "user",
        content: `
Summarize this meeting transcript. Focus on what matters to me based on my role and goals.

Attendees: ${request.attendees.join(", ")}

Transcript:
${request.transcript}

Provide:
1. Key decisions
2. Action items for ME specifically
3. Topics I should follow up on
        `.trim(),
      },
    ],
  });

  return completion.choices[0].message.content!;
}

// Usage
const summary = await summarizeMeeting({
  transcript: `...meeting transcript...`,
  attendees: ["Alice", "Bob", "Carol"],
  continuumApiKey: process.env.CONTINUUM_API_KEY!,
});

console.log(summary);
```

---

## Custom GPT Integration

Build a Custom GPT that accesses user memory.

### GPT Instructions

```markdown
You are a personalized AI assistant powered by Continuum.

Before responding to any user query:

1. The user will provide their Continuum API key
2. Call the Continuum API to fetch their identity graph
3. Use their profile to personalize your responses

Always adapt to:
- Their preferred communication tone
- Their goals and current focus
- Their skills and background
- Their constraints and preferences

When you don't have their API key, ask for it first.
```

### Action Schema (OpenAPI)

```yaml
openapi: 3.0.0
info:
  title: Continuum API
  version: 1.0.0
servers:
  - url: https://your-continuum-instance.com
paths:
  /api/identity-graph:
    get:
      operationId: getIdentityGraph
      summary: Fetch user's identity graph
      security:
        - BearerAuth: []
      responses:
        "200":
          description: Identity graph retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  profile:
                    type: object
                  version:
                    type: integer
                  updated_at:
                    type: integer
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
```

### Example Conversation

```
User: My Continuum API key is pk_live_abc123xyz...

GPT: Thanks! Let me fetch your profile... [calls API]

I can see you're a software engineer focused on AI infrastructure, you prefer direct technical communication, and you're currently working on building developer tools.

What can I help you with today?

User: Help me plan my sprint

GPT: Based on your current focus (AI infrastructure) and goals (launch beta), here's a suggested sprint plan...

[Response is tailored to their role, goals, and constraints from the identity graph]
```

---

## Next Steps

These examples show how to integrate portable AI memory into your applications. The key benefits:

1. **Personalization without data storage** - You never store user data; you fetch it on-demand
2. **Consistency across tools** - Users get the same personalized experience everywhere
3. **User control** - Users own and control their memory, not you

**Build something with Continuum?** Share it with the community!
