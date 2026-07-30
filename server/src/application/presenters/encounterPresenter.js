import { CombatSession } from "../../game/simulation/combatSession.js";

export function toParticipantSummary(definition) {
  const view = new CombatSession();
  view.addParticipant(definition);
  const participant = view.snapshot().participants[0];
  const weapon = definition.weapon ?? null;
  const attack = weapon
    ? { name: weapon.name, attackBonus: (weapon.attack ?? weapon).attackBonus ?? null, damageDie: (weapon.attack ?? weapon).damageDie ?? null }
    : { name: "Unarmed strike", attackBonus: null, damageDie: null };
  return {
    id: definition.id,
    name: participant.identity.name,
    kind: definition.kind,
    role: definition.role ?? (definition.kind === "character" ? "Adventurer" : "Creature"),
    level: definition.level ?? null,
    hitPoints: participant.health,
    armorClass: participant.armorClass,
    controller: participant.controller,
    description: definition.description ?? "A combat-ready definition from the server content catalog.",
    attack,
  };
}

export function toScenarioSummary(scenario) {
  return {
    id: scenario.id, name: scenario.name, description: scenario.description,
    startingDistance: scenario.startingDistance, cover: scenario.cover, terrain: scenario.terrain,
  };
}
