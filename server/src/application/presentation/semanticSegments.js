export function textSegment(text) { return { text }; }
export function semanticSegment(text, kind, referenceId) { return { text, semantic: { kind, referenceId } }; }
