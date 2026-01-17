import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { parseUploadedFiles } from "../../../lib/parseFiles";

export const runtime = "nodejs";          // allow Node APIs for JSZip
export const maxDuration = 60;            // give this route up to 60s (requires Vercel Pro)
export const dynamic = "force-dynamic";   // disable static optimization

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
}

// Helper: build human-readable profile text from JSON
function buildProfileText(profileJson: any): string {
  const p = profileJson?.profile ?? {};

  const basic = p.basic ?? {};
  const preferences = p.preferences ?? {};
  const work = p.work ?? {};
  const goals = p.goals ?? {};

  const arr = (v: any) => (Array.isArray(v) ? v : []);
  const orNA = (v: any) =>
    typeof v === "string" && v.trim().length ? v : "N/A";

  return `
Portable AI Memory Profile

Basic:
- Name: ${orNA(basic.name)}
- Age range: ${orNA(basic.age_range)}
- Location: ${orNA(basic.location)}

Preferences:
- Likes: ${arr(preferences.likes).join(", ") || "N/A"}
- Dislikes: ${arr(preferences.dislikes).join(", ") || "N/A"}
- Tone: ${orNA(preferences.tone)}

Work:
- Roles: ${arr(work.roles).join(", ") || "N/A"}
- Industries: ${arr(work.industries).join(", ") || "N/A"}
- Current focus: ${arr(work.current_focus).join(", ") || "N/A"}

Goals:
- Short term: ${arr(goals.short_term).join(", ") || "N/A"}
- Long term: ${arr(goals.long_term).join(", ") || "N/A"}

Constraints:
- ${arr(p.constraints).join(", ") || "N/A"}

Skills:
- ${arr(p.skills).join(", ") || "N/A"}

Communication style:
- ${arr(p.communication_style).join(", ") || "N/A"}
`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files");

    const uploadFiles = files.filter((f): f is File => f instanceof File);
    if (!uploadFiles.length) {
      return NextResponse.json(
        { error: "No files received." },
        { status: 400 }
      );
    }

    // 1) Parse all uploaded files into a unified plain-text history
    const { text: unifiedHistory, source } = await parseUploadedFiles(uploadFiles);

    if (!unifiedHistory || !unifiedHistory.trim()) {
      return NextResponse.json(
        { error: "Could not extract any readable text from your files." },
        { status: 400 }
      );
    }

    // 2) Aggressive truncation/sampling so we never overload OpenAI
    // Rough: 4 chars ≈ 1 token. 8k chars ≈ 2000 tokens → fast & cheap.
    // Optimized for Vercel free tier (10s timeout)
    const MAX_CHARS = 8_000;

    let textForModel = unifiedHistory;
    let truncated = false;

    if (textForModel.length > MAX_CHARS) {
      const headSize = 5_000;
      const tailSize = 2_000;

      const head = textForModel.slice(0, headSize);
      const tail = textForModel.slice(-tailSize);

      textForModel =
        head +
        "\n\n...[TRUNCATED FOR LENGTH – MIDDLE OMITTED]...\n\n" +
        tail;

      truncated = true;
    }

    const prompt = `
You are a Memory Extraction Engine.

Your job:
- Read the user's AI history text.
- Infer a stable, portable identity profile.
- Capture preferences, work context, goals, constraints, skills, and communication style.

Return ONLY a valid JSON object with this exact schema:

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

Rules:
- Use ONLY information that is clearly implied by the text.
- Do NOT invent specific facts (age, city, etc) if not stated. Use null or [].
- Keep arrays concise but meaningful.

User AI history:
"""${textForModel}"""
`.trim();

    // 3) Call OpenAI with JSON mode and a compact model
    // Add timeout to fail fast on Vercel free tier (10s limit)
    const openai = getOpenAIClient();

    const completion = await openai.chat.completions.create(
      {
        model: "gpt-4.1-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You extract a user's identity and preferences from messy history text. You MUST return strictly valid JSON.",
          },
          { role: "user", content: prompt },
        ],
      },
      {
        timeout: 8000, // 8 second timeout for OpenAI API call
      }
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No content returned from OpenAI." },
        { status: 500 }
      );
    }

    let profileJson: any;
    try {
      profileJson = JSON.parse(content);
    } catch (err) {
      console.error("Failed to parse JSON from OpenAI:", content);
      return NextResponse.json(
        { error: "Failed to parse JSON from OpenAI." },
        { status: 500 }
      );
    }

    const profileText = buildProfileText(profileJson);

    return NextResponse.json(
      {
        profileJson: {
          ...profileJson,
          _meta: {
            truncated,
            sourceType: "multi-file",
            detectedSource: source, // chatgpt, claude, gemini, or unknown
          },
        },
        profileText,
        source, // Pass to frontend
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("UPLOAD-FILES API ERROR:", err);

    let msg = "Internal server error while extracting your identity graph.";

    // Provide better error messages for common issues
    if (err?.code === "ETIMEDOUT" || err?.message?.includes("timeout")) {
      msg = "Processing timeout. Try a smaller file or upgrade to Vercel Pro for longer processing times.";
    } else if (err?.message) {
      msg = err.message;
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

