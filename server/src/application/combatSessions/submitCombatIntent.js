import { applicationError } from "../../../../shared/src/index.js";
import { advanceAutomaticTurns } from "../ai/advanceAutomaticTurns.js";
import { presentEvents } from "../presentation/presentEvents.js";

export function submitCombatIntent(sessionId, intent, { sessionRepository }) {
  const session = sessionRepository.findById(sessionId);
  if (!session) return { ok: false, error: applicationError("SESSION_NOT_FOUND") };
  const before = session.events.all().at(-1)?.sequence ?? 0;
  const result = session.submitIntent(intent);
  const automatic = result.ok === false ? { ok: true, actions: [] } : advanceAutomaticTurns(session);
  if (!automatic.ok) return automatic;
  const snapshot = session.snapshot();
  return { ok: result.ok !== false, result, events: presentEvents(session.events.since(before), snapshot), snapshot, nextEventCursor: session.events.all().at(-1)?.sequence ?? 0, automaticActions: automatic.actions, status: session.status, ...(result.ok === false ? { error: applicationError(result.reason) } : {}) };
}
