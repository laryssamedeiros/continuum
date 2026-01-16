// app/lib/parsers/index.ts
import JSZip from "jszip";
import { detectProvider, Provider } from "./detect";
import { parseChatGPTZip } from "./chatgpt";
import { parsePlaintextFiles } from "./plaintext";
import { parseClaudeFiles } from "./claude";
import { parseGeminiFiles } from "./gemini";

export type SupportedProvider = Provider;

/**
 * Main entry point:
 * - Detect provider
 * - Route to the correct parser
 * - Return unified "rawText" plus some metadata.
 */
export async function parseFilesToUnifiedHistory(files: File[]): Promise<{
  provider: SupportedProvider;
  sourceLabel: string;
  rawText: string;
}> {
  if (!files.length) {
    throw new Error("No files uploaded.");
  }

  const provider = await detectProvider(files);

  switch (provider) {
    case "chatgpt": {
      const zipFile = files.find((f) =>
        f.name.toLowerCase().endsWith(".zip")
      );
      if (!zipFile) {
        throw new Error("ChatGPT export detection failed: ZIP file not found.");
      }
      const buffer = await zipFile.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const rawText = await parseChatGPTZip(zip);
      return {
        provider,
        sourceLabel: zipFile.name,
        rawText,
      };
    }

    case "claude": {
      // Not actually detected yet, but here for future expansion.
      const rawText = await parseClaudeFiles(files);
      return {
        provider,
        sourceLabel: files.map((f) => f.name).join(", "),
        rawText,
      };
    }

    case "gemini": {
      // Not actually detected yet, but here for future expansion.
      const rawText = await parseGeminiFiles(files);
      return {
        provider,
        sourceLabel: files.map((f) => f.name).join(", "),
        rawText,
      };
    }

    case "plaintext":
    case "unknown":
    default: {
      const rawText = await parsePlaintextFiles(files);
      return {
        provider: provider === "unknown" ? "plaintext" : provider,
        sourceLabel: files.map((f) => f.name).join(", "),
        rawText,
      };
    }
  }
}
