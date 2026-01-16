// app/lib/parsers/detect.ts

export type Provider =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "plaintext"
  | "unknown";

/**
 * Very simple detection for now:
 * - If there's a .zip, we assume ChatGPT export.
 * - Otherwise, treat as plaintext.
 *
 * Later, you can upgrade this to inspect file contents
 * and distinguish Claude / Gemini / others.
 */
export async function detectProvider(files: File[]): Promise<Provider> {
  if (!files.length) return "unknown";

  const hasZip = files.some((f) =>
    f.name.toLowerCase().endsWith(".zip")
  );

  if (hasZip) {
    return "chatgpt";
  }

  // In the future, add detection for Claude / Gemini here.

  return "plaintext";
}
