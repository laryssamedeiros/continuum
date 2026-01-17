// app/lib/parsers/claude.ts

/**
 * Parser for Claude exports.
 * Supports:
 * - Official Claude ZIP exports (JSON format from Settings > Privacy)
 * - Third-party exports (Markdown, JSON, TXT from Claude Exporter extension)
 * - Individual JSON files
 *
 * Ensures FULL conversation history extraction (all messages, all conversations)
 */
export async function parseClaudeFiles(files: File[]): Promise<string> {
  const conversations: string[] = [];

  for (const file of files) {
    const lower = file.name.toLowerCase();

    // Handle JSON files (official Claude export format)
    if (lower.endsWith(".json")) {
      try {
        const content = await file.text();
        const data = JSON.parse(content);

        // Official Claude export format - usually has conversations array
        if (Array.isArray(data)) {
          // Array of conversations
          for (const conv of data) {
            const parsed = parseClaudeConversation(conv);
            if (parsed) conversations.push(parsed);
          }
        } else if (data.conversations && Array.isArray(data.conversations)) {
          // Wrapped in conversations key
          for (const conv of data.conversations) {
            const parsed = parseClaudeConversation(conv);
            if (parsed) conversations.push(parsed);
          }
        } else if (data.messages || data.chat) {
          // Single conversation
          const parsed = parseClaudeConversation(data);
          if (parsed) conversations.push(parsed);
        } else {
          // Fallback: try to extract any text content
          conversations.push(`\n\n=== CLAUDE JSON: ${file.name} ===\n${JSON.stringify(data, null, 2)}`);
        }
      } catch (error) {
        console.error(`Failed to parse Claude JSON file ${file.name}:`, error);
      }
    }

    // Handle Markdown files (from Claude Exporter extension)
    else if (lower.endsWith(".md")) {
      const content = await file.text();
      conversations.push(`\n\n=== CLAUDE CONVERSATION (Markdown) ===\n${content}`);
    }

    // Handle text files
    else if (lower.endsWith(".txt") || file.type.startsWith("text/")) {
      const content = await file.text();
      conversations.push(`\n\n=== CLAUDE CONVERSATION (Text) ===\n${content}`);
    }
  }

  if (conversations.length === 0) {
    return "No readable Claude export content found.";
  }

  return conversations.join("\n\n");
}

/**
 * Parse a single Claude conversation object
 */
function parseClaudeConversation(conv: any): string | null {
  const parts: string[] = [];

  // Extract conversation title/name
  const title = conv.name || conv.title || conv.uuid || "Untitled Conversation";
  parts.push(`\n=== CONVERSATION: ${title} ===`);

  // Extract created/updated timestamps
  if (conv.created_at) {
    parts.push(`Created: ${new Date(conv.created_at).toLocaleString()}`);
  }
  if (conv.updated_at) {
    parts.push(`Updated: ${new Date(conv.updated_at).toLocaleString()}`);
  }

  parts.push("\n");

  // Extract messages - handle different possible structures
  let messages: any[] = [];

  if (conv.messages && Array.isArray(conv.messages)) {
    messages = conv.messages;
  } else if (conv.chat && Array.isArray(conv.chat)) {
    messages = conv.chat;
  } else if (conv.chat_messages && Array.isArray(conv.chat_messages)) {
    messages = conv.chat_messages;
  }

  // Sort by timestamp to ensure chronological order
  messages.sort((a, b) => {
    const timeA = a.created_at || a.timestamp || 0;
    const timeB = b.created_at || b.timestamp || 0;
    return new Date(timeA).getTime() - new Date(timeB).getTime();
  });

  // Extract ALL messages (ensuring full history)
  for (const msg of messages) {
    const sender = msg.sender || msg.role || msg.type || "unknown";
    const text = msg.text || msg.content || msg.message || "";

    if (text) {
      const timestamp = msg.created_at || msg.timestamp || "";
      const timeStr = timestamp ? ` (${new Date(timestamp).toLocaleString()})` : "";

      parts.push(`${sender.toUpperCase()}${timeStr}:`);
      parts.push(text);
      parts.push("");
    }
  }

  return parts.length > 3 ? parts.join("\n") : null; // Only return if we found actual content
}
  