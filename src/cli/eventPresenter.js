export function presentEvent(event, names) {
  const name = (id) => names.get(id) ?? id;

  switch (event.type) {
    case "COMBAT_STARTED":
      return "\n=== COMBAT STARTED ===";
    case "ROUND_STARTED":
      return `\n=== ROUND ${event.round} ===`;
    case "TURN_STARTED":
      return `\nTurn: ${name(event.entityId)} (round ${event.round})`;
    case "INTENT_DECLARED":
      return `${name(event.actorId)} intends to attack ${name(event.targetId)}.`;
    case "INTENT_REJECTED":
      return `Rejected: ${event.reason}`;
    case "TURN_PASSED":
      return `${name(event.entityId)} passes.`;
    case "CONDITION_APPLIED":
      return `${name(event.entityId)} gains ${event.condition}.`;
    case "CONDITION_EXPIRED":
      return `${name(event.entityId)} loses ${event.condition}.`;
    case "DICE_ROLLED":
      return `Dice · ${name(event.actorId)} ${event.purpose}: ${event.notation} (${event.rolls?.join(", ") ?? event.naturalRoll}) ${signed(event.modifier)} = ${event.total}`;
    case "ATTACK_MISSED":
      return `Dungeon Master: ${name(event.actorId)} misses ${name(event.targetId)}.`;
    case "DAMAGE_APPLIED":
      return `Dungeon Master: ${name(event.targetId)} takes ${event.amount} ${event.damageType.toLowerCase()} damage (${event.remainingHitPoints} HP left).`;
    case "COMBATANT_DEFEATED":
      return `Dungeon Master: ${name(event.entityId)} is defeated.`;
    case "COMBAT_FINISHED":
      return `\n=== COMBAT FINISHED · ${event.winnerFaction ?? "no winner"} ===`;
    default:
      return null;
  }
}

function signed(value) {
  if (!value) return "+ 0";
  return value > 0 ? `+ ${value}` : `- ${Math.abs(value)}`;
}
