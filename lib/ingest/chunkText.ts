// lib/ingest/chunkText.ts

/**
 * Rough text chunker based on character count.
 * This keeps each chunk relatively small so it fits safely within model limits.
 *
 * maxCharsPerChunk ~ 8000 ≈ ~2000 tokens (roughly)
 * maxChunks limits total cost and TPM.
 */
export function chunkText(
    input: string,
    maxCharsPerChunk = 8000,
    maxChunks = 10
  ): string[] {
    const text = input.replace(/\r\n/g, "\n").trim();
    if (!text) return [];
  
    if (text.length <= maxCharsPerChunk) return [text];
  
    const chunks: string[] = [];
    let start = 0;
  
    while (start < text.length && chunks.length < maxChunks) {
      let end = start + maxCharsPerChunk;
      if (end > text.length) {
        end = text.length;
      } else {
        // Try to break on a paragraph boundary
        const lastParaBreak = text.lastIndexOf("\n\n", end);
        if (lastParaBreak > start + maxCharsPerChunk * 0.3) {
          end = lastParaBreak;
        }
      }
  
      const chunk = text.slice(start, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      start = end;
    }
  
    return chunks;
  }
  