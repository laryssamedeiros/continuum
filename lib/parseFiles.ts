import JSZip from "jszip";

/**
 * Given an array of uploaded File objects (from the browser),
 * return a single unified plain-text "history" string.
 *
 * Supports:
 * - .zip (ChatGPT export or similar)
 * - .txt, .json, .md, .html, .htm
 */
export async function parseUploadedFiles(files: File[]): Promise<string> {
  const chunks: string[] = [];

  for (const file of files) {
    const lowerName = file.name.toLowerCase();

    // If it's a ZIP (e.g. ChatGPT export)
    if (lowerName.endsWith(".zip")) {
      const buf = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buf);

      // Iterate over entries inside the zip
      const entries = Object.entries(zip.files);
      for (const [path, entry] of entries) {
        if (entry.dir) continue; // skip folders

        const lowerPath = path.toLowerCase();

        // Only parse text-like files
        const isTextLike =
          lowerPath.endsWith(".json") ||
          lowerPath.endsWith(".txt") ||
          lowerPath.endsWith(".md") ||
          lowerPath.endsWith(".html") ||
          lowerPath.endsWith(".htm");

        if (!isTextLike) continue;

        const raw = await entry.async("string");
        const cleaned = stripHtmlIfNeeded(raw, lowerPath);

        chunks.push(`\n\n[FILE: ${path}]\n${cleaned}\n`);
      }
    } else {
      // Normal single file (txt/json/md/html/etc.)
      const raw = await file.text();
      const cleaned = stripHtmlIfNeeded(raw, lowerName);
      chunks.push(`\n\n[FILE: ${file.name}]\n${cleaned}\n`);
    }
  }

  return chunks.join("\n").trim();
}

/**
 * Super-simple HTML stripper for .html / .htm files.
 * Not perfect, but good enough for feeding to the LLM.
 */
function stripHtmlIfNeeded(text: string, filenameLower: string): string {
  if (filenameLower.endsWith(".html") || filenameLower.endsWith(".htm")) {
    // remove tags
    const noTags = text.replace(/<[^>]+>/g, " ");
    // collapse whitespace a bit
    return noTags.replace(/\s+/g, " ").trim();
  }
  return text;
}

