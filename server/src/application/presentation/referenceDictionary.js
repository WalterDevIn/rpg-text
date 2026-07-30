export function entityReference(participant) {
  return {
    kind: participant.identity.kind === "character" ? "CHARACTER" : "CREATURE",
    name: participant.identity.name,
    description: participant.identity.description ?? "Una entidad del combate.",
    faction: participant.faction,
    currentHitPoints: participant.health.current,
    maximumHitPoints: participant.health.max,
    armorClass: participant.armorClass,
    conditions: participant.conditions,
    defeated: participant.defeated,
    controller: participant.controller,
  };
}
