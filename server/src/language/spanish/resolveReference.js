import { normalizeSpanishText } from "./normalizeSpanishText.js";

const ignoredReferenceWords = new Set(["a", "al", "la", "el", "los", "las", "un", "una", "unos", "unas", "mi", "mis", "con", "de", "del", "por", "favor"]);
const typeAliases = new Map([["criatura", "creature"], ["criaturas", "creature"], ["monstruo", "creature"], ["monstruos", "creature"], ["personaje", "character"], ["personajes", "character"]]);

export function resolveReference(words, candidates) {
  const query = normalizeSpanishText(words.map((word) => word.normalized ?? word).join(" "));
  const meaningful = query.split(" ").filter((word) => !ignoredReferenceWords.has(word));
  const normalizedQuery = meaningful.join(" ");
  if (!normalizedQuery) return { status: "INCOMPLETE", candidates: [] };
  const exactName = candidates.filter((candidate) => normalizeSpanishText(candidate.name) === normalizedQuery);
  if (exactName.length === 1) return resolved(exactName[0]);
  if (exactName.length > 1) return ambiguous(exactName);
  const exactAlias = candidates.filter((candidate) => (candidate.aliases ?? []).some((alias) => normalizeSpanishText(alias) === normalizedQuery));
  if (exactAlias.length === 1) return resolved(exactAlias[0]);
  if (exactAlias.length > 1) return ambiguous(exactAlias);
  const type = typeAliases.get(normalizedQuery);
  if (type) {
    const typed = candidates.filter((candidate) => candidate.kind === type);
    if (typed.length === 1) return resolved(typed[0]);
    if (typed.length > 1) return ambiguous(typed);
  }
  const partial = candidates.filter((candidate) => {
    const names = [candidate.name, ...(candidate.aliases ?? [])].map(normalizeSpanishText);
    return names.some((name) => name.includes(normalizedQuery) || normalizedQuery.includes(name));
  });
  if (partial.length === 1) return resolved(partial[0]);
  if (partial.length > 1) return ambiguous(partial);
  return { status: "INVALID_CONTEXT", candidates: [] };
}

function resolved(candidate) { return { status: "RESOLVED", candidate }; }
function ambiguous(candidates) { return { status: "AMBIGUOUS", candidates }; }
