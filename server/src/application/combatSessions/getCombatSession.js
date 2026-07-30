import { applicationError } from "../../../../shared/src/index.js";

export function getCombatSession(sessionId, { sessionRepository }) {
  const session = sessionRepository.findById(sessionId);
  if (!session) return { ok: false, error: applicationError("SESSION_NOT_FOUND") };
  return { ok: true, snapshot: session.snapshot(), nextEventCursor: lastEventSequence(session) };
}
function lastEventSequence(session) { return session.events.all().at(-1)?.sequence ?? 0; }
