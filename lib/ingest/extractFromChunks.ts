// lib/ingest/extractFromChunks.ts
import OpenAI from "openai";
import { chunkText } from "./chunkText";
import { mergeProfileJsons, createEmptyProfileJson, ProfileJson } from "./mergeProfiles";

const MODEL = "gpt-4.1-mini";

function buildBasePrompt(chunk: string, index: number, total: number): string {
  return `
You are a Memory Extraction Engine.

You will receive a slice (chunk) of a user's AI history.
This is chunk ${index} of ${total}.

Your job is to extract ONLY information that belongs in this stable identity schema:

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
- Use information from this chunk only.
- If something is not present in this chunk, leave it null or [].
- Do not hallucinate specific details.
- If user is clearly the same person across different mentions, treat it as the same identity.
- Respond with VALID JSON ONLY, no extra text.

Chunk content:
"""${chunk}"""
`.trim();
}

function buildWorkPrompt(chunk: string, index: number, total: number): string {
  return `
You are a Work & Projects Memory Extractor.

You will receive a slice (chunk) of a user's AI history focused on work, projects, or startups.
This is chunk ${index} of ${total}.

Focus especially on:
- work.roles
- work.industries
- work.current_focus
- goals.short_term
- goals.long_term
- constraints related to time, money, energy
- skills that show up in a work context

Use the SAME JSON schema as before:

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
- Only include information that is clearly about work, projects, career, or business.
- If a field is not supported by this chunk, leave it null or [].
- Respond with VALID JSON ONLY.

Chunk content:
"""${chunk}"""
`.trim();
}

/**
 * Hybrid extraction (mode C):
 * - Chunk long text
 * - For each chunk: general extraction
 * - If "work-heavy", do a second work-focused pass
 * - Merge everything into one profile JSON
 */
export async function extractIdentityFromLongText(
  openai: OpenAI,
  rawText: string
): Promise<{
  profileJson: ProfileJson;
  chunkCount: number;
  usedChunks: number;
}> {
  const chunks = chunkText(rawText, 8000, 10);
  if (!chunks.length) {
    return {
      profileJson: createEmptyProfileJson(),
      chunkCount: 0,
      usedChunks: 0,
    };
  }

  const partials: ProfileJson[] = [];
  let used = 0;

  for (let i = 0; i < chunks.length; i++) {
    const idx = i + 1;
    const chunk = chunks[i];

    // ----- General extraction -----
    const generalPrompt = buildBasePrompt(chunk, idx, chunks.length);

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You extract and structure user memory into a strict JSON schema. Respond with valid JSON only.",
        },
        {
          role: "user",
          content: generalPrompt,
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        partials.push(parsed);
        used++;
      } catch (e) {
        console.error("Failed to parse JSON for general chunk", idx, e);
      }
    }

    // ----- Hybrid extra pass for work-heavy chunks -----
    const workHeavy = /startup|company|client|project|product|launch|roadmap|sprint|marketing|sales|business|revenue/i.test(
      chunk
    );

    if (workHeavy) {
      const workPrompt = buildWorkPrompt(chunk, idx, chunks.length);

      const completion2 = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You extract WORK-RELATED memory into the same JSON schema. Respond with valid JSON only.",
          },
          {
            role: "user",
            content: workPrompt,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      const content2 = completion2.choices[0]?.message?.content;
      if (content2) {
        try {
          const parsed2 = JSON.parse(content2);
          partials.push(parsed2);
          used++;
        } catch (e) {
          console.error("Failed to parse JSON for work chunk", idx, e);
        }
      }
    }
  }

  const merged = mergeProfileJsons(partials);

  return {
    profileJson: merged,
    chunkCount: chunks.length,
    usedChunks: used,
  };
}
