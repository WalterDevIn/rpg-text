import { normalizeSpanishToken } from "./normalizeSpanishText.js";

const tokenPattern = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

export function tokenizeSpanishText(originalText = "") {
  const text = String(originalText);
  return [...text.matchAll(tokenPattern)].map((match) => ({
    text: match[0],
    normalized: normalizeSpanishToken(match[0]),
    start: match.index,
    end: match.index + match[0].length,
  }));
}
