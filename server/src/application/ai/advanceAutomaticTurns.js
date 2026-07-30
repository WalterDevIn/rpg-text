import { applicationError } from "../../../../shared/src/index.js";

const maxAutomaticActions = 100;

export function advanceAutomaticTurns(session) {
  const actions = [];
  while (session.status === "ACTIVE" && actions.length < maxAutomaticActions) {
    const snapshot = session.snapshot();
    const actor = snapshot.participants.find((participant) => participant.entityId === snapshot.activeEntityId);
    if (!actor || actor.controller !== "ai") break;
    const target = snapshot.participants.find((participant) => !participant.defeated && participant.faction !== actor.faction);
    const intent = target ? { type: "ATTACK", actorId: actor.entityId, targetId: target.entityId } : { type: "PASS", actorId: actor.entityId };
    const result = session.submitIntent(intent);
    actions.push({ intent, result });
    if (result.ok === false) return { ok: false, error: applicationError("AI_ACTION_FAILED", "The server could not resolve an automatic creature turn.") };
  }
  if (session.status === "ACTIVE" && session.snapshot().participants.find((participant) => participant.entityId === session.activeEntityId)?.controller === "ai") return { ok: false, error: applicationError("AI_ACTION_LIMIT", "Automatic turn resolution exceeded its safety limit.") };
  return { ok: true, actions };
}
