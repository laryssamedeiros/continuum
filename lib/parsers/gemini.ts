// app/lib/parsers/gemini.ts

/**
 * Placeholder parser for Gemini / Google exports.
 * For now, we just concatenate any text-like files.
 * Later, you can specialize this for Google Takeout formats.
 */
export async function parseGeminiFiles(files: File[]): Promise<string> {
    const parts: string[] = [];
  
    for (const file of files) {
      const lower = file.name.toLowerCase();
      const isTextLike =
        file.type.startsWith("text/") ||
        lower.endsWith(".txt") ||
        lower.endsWith(".md") ||
        lower.endsWith(".json") ||
        lower.endsWith(".html") ||
        lower.endsWith(".log");
  
      if (!isTextLike) continue;
  
      const content = await file.text();
      parts.push(`\n\n=== GEMINI FILE: ${file.name} ===\n${content}`);
    }
  
    if (parts.length === 0) {
      return "No readable Gemini export content found.";
    }
  
    return parts.join("\n");
  }
  