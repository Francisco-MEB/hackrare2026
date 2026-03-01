/**
 * Convert markdown-style text to plain prose (strips **, *, bullets, etc.)
 */
export function markdownToProse(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")   // **bold** → bold
    .replace(/\*([^*]+)\*/g, "$1")       // *italic* → italic
    .replace(/^[\s]*[-*]\s+/gm, "")      // bullet lines
    .replace(/^[\s]*\d+\.\s+/gm, "")     // numbered list
    .replace(/#{1,6}\s+/g, "")           // headers
    .replace(/`([^`]+)`/g, "$1")         // `code` → code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [link](url) → link
    .replace(/\n{3,}/g, "\n\n")          // collapse excess newlines
    .trim();
}
