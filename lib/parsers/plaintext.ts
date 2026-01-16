// app/lib/parsers/plaintext.ts

/**
 * Very simple fallback parser:
 * - Reads all text-like files
 * - Concatenates them into a single "user history" string
 */
export async function parsePlaintextFiles(files: File[]): Promise<string> {
    const parts: string[] = [];
  
    for (const file of files) {
      // Only try to parse obviously text-ish things
      const lower = file.name.toLowerCase();
      const isTextLike =
        file.type.startsWith("text/") ||
        lower.endsWith(".txt") ||
        lower.endsWith(".md") ||
        lower.endsWith(".json") ||
        lower.endsWith(".log");
  
      if (!isTextLike) continue;
  
      const content = await file.text();
      parts.push(`\n\n=== FILE: ${file.name} ===\n${content}`);
    }
  
    if (parts.length === 0) {
      return "No readable text content found in uploaded files.";
    }
  
    return parts.join("\n");
  }
  