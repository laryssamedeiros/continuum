import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { rawText } = await req.json();

    if (!rawText || typeof rawText !== "string") {
      return NextResponse.json(
        { error: "rawText is required" },
        { status: 400 }
      );
    }

    const prompt = `
You are a Memory Extraction Engine.

Read the user text below and return ONLY valid JSON.

The JSON must follow this schema exactly:

{
  "profile": {
    "basic": {
      "name": string | null,
      "age_range": string | null,
      "location": string | null
    },
    "preferences": {
      "likes": string[],
      "dislikes": string[],
      "tone": string | null
    },
    "work": {
      "roles": string[],
      "industries": string[],
      "current_focus": string[]
    },
    "goals": {
      "short_term": string[],
      "long_term": string[]
    },
    "constraints": string[],
    "skills": string[],
    "communication_style": string[]
  }
}

Do NOT include any explanation. Respond with JSON only.

User text:
"""${rawText}"""
`;

const openai = getOpenAIClient();
const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "You extract and structure user memory into a strict JSON schema. You MUST respond with valid JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json(
      { error: "No content returned from OpenAI" },
      { status: 500 }
    );
  }
  
  let parsed: any;
  try {
    // In JSON mode, content should be a valid JSON string
    parsed = JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse JSON from OpenAI:", content);
    return NextResponse.json(
      { error: "Failed to parse JSON from OpenAI" },
      { status: 500 }
    );
  }
    const profileJson = parsed;

    const profileText = `
Portable AI Memory Profile

Basic:
- Name: ${profileJson.profile.basic.name ?? "N/A"}
- Age range: ${profileJson.profile.basic.age_range ?? "N/A"}
- Location: ${profileJson.profile.basic.location ?? "N/A"}

Preferences:
- Likes: ${profileJson.profile.preferences.likes.join(", ") || "N/A"}
- Dislikes: ${profileJson.profile.preferences.dislikes.join(", ") || "N/A"}
- Tone: ${profileJson.profile.preferences.tone ?? "N/A"}

Work:
- Roles: ${profileJson.profile.work.roles.join(", ") || "N/A"}
- Industries: ${profileJson.profile.work.industries.join(", ") || "N/A"}
- Current focus: ${profileJson.profile.work.current_focus.join(", ") || "N/A"}

Goals:
- Short term: ${profileJson.profile.goals.short_term.join(", ") || "N/A"}
- Long term: ${profileJson.profile.goals.long_term.join(", ") || "N/A"}

Constraints:
- ${profileJson.profile.constraints.join(", ") || "N/A"}

Skills:
- ${profileJson.profile.skills.join(", ") || "N/A"}

Communication style:
- ${profileJson.profile.communication_style.join(", ") || "N/A"}
`.trim();

    return NextResponse.json(
      { profileJson, profileText },
      { status: 200 }
    );
} catch (err: any) {
    console.error("UPLOAD API ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
