// app/lib/parsers/claude.ts

/**
 * Placeholder parser for Claude exports.
 * For now, we just concatenate any text-like files.
 * Later, you can upgrade this to support real Claude export formats.
 */
export async function parseClaudeFiles(files: File[]): Promise<string> {
    const parts: string[] = [];
  
    for (const file of files) {
      const lower = file.name.toLowerCase();
      const isTextLike =
        file.type.startsWith("text/") ||
        lower.endsWith(".txt") ||
        lower.endsWith(".md") ||
        lower.endsWith(".json") ||
        lower.endsWith(".log");
  
      if (!isTextLike) continue;
  
      const content = await file.text();
      parts.push(`\n\n=== CLAUDE FILE: ${file.name} ===\n${content}`);
    }
  
    if (parts.length === 0) {
      return "No readable Claude export content found.";
    }
  
    return parts.join("\n");
  }
  