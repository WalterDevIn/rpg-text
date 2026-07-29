export function presentEvent(event, names) {
  const name = (id) => names.get(id) ?? id;

  switch (event.type) {
    case "COMBAT_STARTED":
      return "\n=== COMBAT STARTED ===";
    case "TURN_STARTED":
      return `\nTurn: ${name(event.entityId)}`;
    case "INTENT_DECLARED":
      return `${name(event.actorId)} intends to attack ${name(event.targetId)}.`;
    case "DICE_ROLLED":
      return `Dice · ${name(event.actorId)} ${event.purpose}: ${event.notation} (${event.naturalRoll}) ${signed(event.modifier)} = ${event.total}`;
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
