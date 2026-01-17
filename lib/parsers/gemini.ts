// app/lib/parsers/gemini.ts

/**
 * Parser for Google Gemini exports.
 * Supports:
 * - Gemini Chat Exporter extension (JSON format)
 * - Gemini CLI exports (JSONL, Markdown)
 * - Third-party exporters (JSON, Markdown, TXT)
 *
 * Ensures FULL conversation history extraction (all messages, all conversations)
 */
export async function parseGeminiFiles(files: File[]): Promise<string> {
  const conversations: string[] = [];

  for (const file of files) {
    const lower = file.name.toLowerCase();

    // Handle JSON files (from Gemini Chat Exporter extension)
    if (lower.endsWith(".json")) {
      try {
        const content = await file.text();
        const data = JSON.parse(content);

        // Gemini exports can be array of conversations or single conversation
        if (Array.isArray(data)) {
          for (const conv of data) {
            const parsed = parseGeminiConversation(conv);
            if (parsed) conversations.push(parsed);
          }
        } else if (data.chats && Array.isArray(data.chats)) {
          // Wrapped in chats key
          for (const conv of data.chats) {
            const parsed = parseGeminiConversation(conv);
            if (parsed) conversations.push(parsed);
          }
        } else if (data.conversations && Array.isArray(data.conversations)) {
          // Wrapped in conversations key
          for (const conv of data.conversations) {
            const parsed = parseGeminiConversation(conv);
            if (parsed) conversations.push(parsed);
          }
        } else {
          // Single conversation
          const parsed = parseGeminiConversation(data);
          if (parsed) conversations.push(parsed);
        }
      } catch (error) {
        console.error(`Failed to parse Gemini JSON file ${file.name}:`, error);
      }
    }

    // Handle JSONL files (from Gemini CLI /export jsonl)
    else if (lower.endsWith(".jsonl")) {
      try {
        const content = await file.text();
        const lines = content.split("\n").filter(line => line.trim());

        for (const line of lines) {
          const data = JSON.parse(line);
          const parsed = parseGeminiConversation(data);
          if (parsed) conversations.push(parsed);
        }
      } catch (error) {
        console.error(`Failed to parse Gemini JSONL file ${file.name}:`, error);
      }
    }

    // Handle Markdown files (from Gemini CLI /export markdown or extensions)
    else if (lower.endsWith(".md")) {
      const content = await file.text();
      conversations.push(`\n\n=== GEMINI CONVERSATION (Markdown) ===\n${content}`);
    }

    // Handle HTML files (some exporters use HTML)
    else if (lower.endsWith(".html")) {
      const content = await file.text();
      // Strip HTML tags for plain text (basic cleanup)
      const plainText = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      conversations.push(`\n\n=== GEMINI CONVERSATION (HTML) ===\n${plainText}`);
    }

    // Handle text files
    else if (lower.endsWith(".txt") || file.type.startsWith("text/")) {
      const content = await file.text();
      conversations.push(`\n\n=== GEMINI CONVERSATION (Text) ===\n${content}`);
    }
  }

  if (conversations.length === 0) {
    return "No readable Gemini export content found.";
  }

  return conversations.join("\n\n");
}

/**
 * Parse a single Gemini conversation object
 */
function parseGeminiConversation(conv: any): string | null {
  const parts: string[] = [];

  // Extract conversation title
  const title = conv.title || conv.name || conv.id || "Untitled Conversation";
  parts.push(`\n=== CONVERSATION: ${title} ===`);

  // Extract timestamps
  if (conv.created_at || conv.createTime) {
    const timestamp = conv.created_at || conv.createTime;
    parts.push(`Created: ${new Date(timestamp).toLocaleString()}`);
  }
  if (conv.updated_at || conv.updateTime) {
    const timestamp = conv.updated_at || conv.updateTime;
    parts.push(`Updated: ${new Date(timestamp).toLocaleString()}`);
  }

  parts.push("\n");

  // Extract messages - handle different possible structures
  let messages: any[] = [];

  if (conv.messages && Array.isArray(conv.messages)) {
    messages = conv.messages;
  } else if (conv.turns && Array.isArray(conv.turns)) {
    messages = conv.turns;
  } else if (conv.history && Array.isArray(conv.history)) {
    messages = conv.history;
  } else if (conv.parts && Array.isArray(conv.parts)) {
    messages = conv.parts;
  }

  // Sort by timestamp to ensure chronological order
  messages.sort((a, b) => {
    const timeA = a.timestamp || a.createTime || a.time || 0;
    const timeB = b.timestamp || b.createTime || b.time || 0;
    return new Date(timeA).getTime() - new Date(timeB).getTime();
  });

  // Extract ALL messages (ensuring full history)
  for (const msg of messages) {
    const role = msg.role || msg.author || msg.sender || "unknown";

    // Gemini messages can have different content structures
    let text = "";
    if (typeof msg.content === "string") {
      text = msg.content;
    } else if (msg.text) {
      text = msg.text;
    } else if (msg.parts && Array.isArray(msg.parts)) {
      // Gemini API format - parts array
      text = msg.parts.map((part: any) => part.text || "").join(" ");
    } else if (msg.content && msg.content.parts) {
      text = msg.content.parts.map((part: any) => part.text || "").join(" ");
    }

    if (text.trim()) {
      const timestamp = msg.timestamp || msg.createTime || msg.time || "";
      const timeStr = timestamp ? ` (${new Date(timestamp).toLocaleString()})` : "";

      parts.push(`${role.toUpperCase()}${timeStr}:`);
      parts.push(text);
      parts.push("");
    }
  }

  return parts.length > 3 ? parts.join("\n") : null; // Only return if we found actual content
}
  