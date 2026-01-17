import JSZip from "jszip";

/**
 * Detect which LLM the export came from based on file structure and content
 */
function detectSource(files: File[], zipContents?: { [path: string]: any }): "chatgpt" | "claude" | "gemini" | "unknown" {
  // Check ZIP contents first (most reliable)
  if (zipContents) {
    const paths = Object.keys(zipContents).map(p => p.toLowerCase());

    // ChatGPT exports have conversations.json or messages.json
    if (paths.some(p => p.includes("conversations.json") || p.includes("messages.json"))) {
      return "chatgpt";
    }

    // Claude exports typically have .dms files or specific JSON structure
    if (paths.some(p => p.endsWith(".dms") || p.includes("claude"))) {
      return "claude";
    }
  }

  // Check individual file names
  for (const file of files) {
    const lowerName = file.name.toLowerCase();

    // ChatGPT patterns
    if (lowerName.includes("chatgpt") || lowerName.includes("conversations.json")) {
      return "chatgpt";
    }

    // Claude patterns
    if (lowerName.includes("claude") || lowerName.endsWith(".dms")) {
      return "claude";
    }

    // Gemini patterns
    if (lowerName.includes("gemini") || lowerName.includes("bard")) {
      return "gemini";
    }
  }

  return "unknown";
}

/**
 * Given an array of uploaded File objects (from the browser),
 * return a single unified plain-text "history" string and detected source.
 *
 * Supports:
 * - .zip (ChatGPT export or similar)
 * - .txt, .json, .md, .html, .htm
 */
export async function parseUploadedFiles(files: File[]): Promise<{
  text: string;
  source: "chatgpt" | "claude" | "gemini" | "unknown";
}> {
  const chunks: string[] = [];
  let detectedSource: "chatgpt" | "claude" | "gemini" | "unknown" = "unknown";
  let zipContents: { [path: string]: any } | undefined;

  for (const file of files) {
    const lowerName = file.name.toLowerCase();

    // If it's a ZIP (e.g. ChatGPT export)
    if (lowerName.endsWith(".zip")) {
      const buf = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buf);
      zipContents = zip.files;

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

  // Detect source
  detectedSource = detectSource(files, zipContents);

  return {
    text: chunks.join("\n").trim(),
    source: detectedSource,
  };
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

