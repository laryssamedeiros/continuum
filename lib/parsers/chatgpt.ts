// app/lib/parsers/chatgpt.ts
import JSZip from "jszip";

/**
 * Parse a ChatGPT export ZIP into a unified "user history" text.
 * This tries to handle common "conversations.json" style exports.
 */
export async function parseChatGPTZip(zip: JSZip): Promise<string> {
  // Try some common filenames for the conversation dump
  const possibleFiles = [
    "conversations.json",
    "messages.json",
    "data/conversations.json",
    "data/messages.json",
  ];

  let conversationsFile: JSZip.JSZipObject | null = null;

  for (const name of possibleFiles) {
    const f = zip.file(name);
    if (f) {
      conversationsFile = f;
      break;
    }
  }

  // If we didn't find the expected file, just dump all .json for now
  if (!conversationsFile) {
    // Fallback: read all .json files and concatenate
    const jsonFiles = zip.file(/\.json$/i) || [];
    if (!jsonFiles.length) {
      return "No conversations.json or messages.json found in ChatGPT export.";
    }

    const chunks: string[] = [];
    for (const f of jsonFiles) {
      const text = await f.async("text");
      chunks.push(`\n\n=== JSON FILE: ${f.name} ===\n${text}`);
    }
    return chunks.join("\n");
  }

  // Parse the main conversations file
  const raw = await conversationsFile.async("text");
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse conversations.json as JSON:", e);
    return raw;
  }

  if (!Array.isArray(parsed)) {
    // Different format; just dump it as text
    return raw;
  }

  const lines: string[] = [];

  for (const conv of parsed) {
    const title = conv.title || conv.id || "Untitled conversation";
    lines.push(`\n\n===== Conversation: ${title} =====\n`);

    // Newer ChatGPT exports use a "mapping" structure
    if (conv.mapping && typeof conv.mapping === "object") {
      const nodes = Object.values(conv.mapping) as any[];

      // Sort nodes by "create_time" if present to keep conversation order
      nodes.sort((a, b) => {
        const ta = a?.message?.create_time ?? 0;
        const tb = b?.message?.create_time ?? 0;
        return ta - tb;
      });

      for (const node of nodes) {
        const msg = node?.message;
        if (!msg) continue;
        const role = msg.author?.role || "unknown";

        // Skip extra system/tool stuff unless you want it
        if (role === "system" || role === "tool") continue;

        // Extract text content from different structures
        const content = msg.content;
        let text = "";

        if (!content) {
          continue;
        } else if (typeof content === "string") {
          text = content;
        } else if (Array.isArray(content.parts)) {
          text = content.parts
            .map((part: any) => {
              if (typeof part === "string") return part;
              if (part?.text) return part.text;
              if (part?.content) return String(part.content);
              return "";
            })
            .join("\n");
        } else if (typeof content === "object") {
          if (typeof content.text === "string") {
            text = content.text;
          } else if (Array.isArray(content.parts)) {
            text = content.parts
              .map((part: any) =>
                typeof part === "string" ? part : part?.text || ""
              )
              .join("\n");
          }
        }

        if (!text.trim()) continue;

        lines.push(`${role.toUpperCase()}: ${text}`);
      }
    }
    // Some older / different exports may have .messages instead
    else if (Array.isArray(conv.messages)) {
      for (const msg of conv.messages) {
        const role = msg.role || msg.author || "unknown";
        let text = "";

        if (typeof msg.content === "string") {
          text = msg.content;
        } else if (Array.isArray(msg.content)) {
          text = msg.content.join("\n");
        } else if (msg.content?.text) {
          text = msg.content.text;
        }

        if (!text.trim()) continue;
        if (role === "system" || role === "tool") continue;

        lines.push(`${String(role).toUpperCase()}: ${text}`);
      }
    }
  }

  if (!lines.length) {
    return "ChatGPT export parsed, but no usable messages were found.";
  }

  return lines.join("\n");
}
