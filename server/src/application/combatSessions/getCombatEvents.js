import { applicationError } from "../../../../shared/src/index.js";
import { presentEvents } from "../presentation/presentEvents.js";

export function getCombatEvents(sessionId, { since = 0, sessionRepository }) {
  const session = sessionRepository.findById(sessionId);
  if (!session) return { ok: false, error: applicationError("SESSION_NOT_FOUND") };
  return { ok: true, events: presentEvents(session.events.since(since), session.snapshot()), nextEventCursor: session.events.all().at(-1)?.sequence ?? 0 };
}
