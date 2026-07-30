/** Temporary storage: all sessions are lost when the server process restarts. */
export function createInMemoryCombatSessionRepository() {
  const sessions = new Map();
  let nextSessionId = 1;
  return {
    allocateId: () => `combat-${nextSessionId++}`,
    save(sessionId, session) {
      sessions.set(sessionId, session);
      return session;
    },
    findById: (sessionId) => sessions.get(sessionId),
    has: (sessionId) => sessions.has(sessionId),
    remove: (sessionId) => sessions.delete(sessionId),
  };
}
