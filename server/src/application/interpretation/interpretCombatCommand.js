import { applicationError } from "../../../../shared/src/index.js";
import { createInterpretationContext } from "./createInterpretationContext.js";
import { parseCombatCommand } from "../../language/spanish/parseCombatCommand.js";

export function interpretCombatCommand(sessionId, text, { sessionRepository }) {
  const session = sessionRepository.findById(sessionId);
  if (!session) return { ok: false, error: applicationError("SESSION_NOT_FOUND") };
  if (typeof text !== "string") return { ok: false, error: applicationError("INVALID_REQUEST", "Command text must be a string.") };
  return { ok: true, interpretation: parseCombatCommand(text, createInterpretationContext(session)) };
}
