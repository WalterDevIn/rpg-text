import { applicationError } from "../../../../shared/src/index.js";
import { interpretCombatCommand } from "./interpretCombatCommand.js";
import { submitCombatIntent } from "../combatSessions/submitCombatIntent.js";

export function executeCombatCommand(sessionId, text, dependencies) {
  const interpreted = interpretCombatCommand(sessionId, text, dependencies);
  if (!interpreted.ok) return interpreted;
  if (interpreted.interpretation.status !== "RESOLVED") return { ok: false, error: applicationError("COMMAND_NOT_RESOLVED", interpreted.interpretation.message ?? "The command needs clarification."), interpretation: interpreted.interpretation };
  const result = submitCombatIntent(sessionId, interpreted.interpretation.intent, dependencies);
  return { ...result, interpretation: interpreted.interpretation };
}
