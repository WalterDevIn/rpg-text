export function createCatalog(definitions) {
  const entries = Object.freeze([...definitions]);
  const byId = new Map(entries.map((definition) => [definition.id, definition]));
  return Object.freeze({
    list: () => entries,
    findById: (id) => byId.get(id),
    has: (id) => byId.has(id),
  });
}
