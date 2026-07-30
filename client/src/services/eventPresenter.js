export function presentCombatEvent(event, participants) {
  const byId = new Map(participants.map((participant) => [participant.entityId, participant]));
  const name = (id) => byId.get(id)?.identity?.name ?? id ?? "unknown";
  const participant = (id) => byId.get(id);
  const isPlayer = (id) => participant(id)?.controller === "manual";
  const toneFor = (id) => participant(id)?.faction === "monsters" ? "hostile" : "friendly";
  const message = (origin, text, tone = "neutral") => ({ id: event.sequence, sequence: event.sequence, type: event.type, origin, tone, text });

  switch (event.type) {
    case "COMBAT_STARTED":
      return message("dm", "The encounter begins. Initiative is being resolved.");
    case "DICE_ROLLED":
      return message("dice", `${name(event.actorId)} - ${event.purpose}: ${event.notation} = ${event.rolls?.join(", ") ?? event.naturalRoll}${formatModifier(event.modifier)} = ${event.total}`);
    case "ROUND_STARTED":
      return message("system", `Round ${event.round} begins.`);
    case "TURN_STARTED":
      return message("dm", `Turn: ${name(event.entityId)} (round ${event.round}).`);
    case "INTENT_DECLARED":
      return message(isPlayer(event.actorId) ? "player" : "creature", `${name(event.actorId)} attacks ${name(event.targetId)}.`, toneFor(event.actorId));
    case "TURN_PASSED":
      return message(isPlayer(event.entityId) ? "player" : "creature", `${name(event.entityId)} passes.`, toneFor(event.entityId));
    case "CONDITION_APPLIED":
      return message(isPlayer(event.entityId) ? "player" : "creature", `${name(event.entityId)} takes a defensive stance (${event.condition}).`, toneFor(event.entityId));
    case "CONDITION_EXPIRED":
      return message("dm", `${name(event.entityId)} is no longer ${event.condition}.`);
    case "ATTACK_MISSED":
      return message("dm", `${name(event.actorId)} misses ${name(event.targetId)} (${event.total} vs AC ${event.armorClass}).`);
    case "ATTACK_HIT":
      return message("dm", `${name(event.actorId)} hits ${name(event.targetId)} for ${event.damage} damage.`);
    case "DAMAGE_APPLIED":
      return message("dm", `${name(event.targetId)} takes ${event.amount} ${String(event.damageType).toLowerCase()} damage (${event.remainingHitPoints} HP remaining).`);
    case "COMBATANT_DEFEATED":
      return message("dm", `${name(event.entityId)} is defeated.`);
    case "COMBAT_FINISHED":
      return message("system", `Combat finished. Winner: ${event.winnerFaction ?? "none"}.`);
    case "INTENT_REJECTED":
      return message("system", `Action rejected: ${event.reason}.`);
    default:
      return message("system", `${event.type}.`);
  }
}

function formatModifier(modifier) {
  if (!modifier) return "";
  return modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`;
}
