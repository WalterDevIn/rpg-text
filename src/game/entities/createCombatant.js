import { Component } from "../components/types.js";

export function createCombatant(world, definition, overrides = {}) {
  validateDefinition(definition);
  const entityId = world.createEntity(definition.kind);
  const merged = mergeDefinition(definition, overrides);

  world.addComponent(entityId, Component.IDENTITY, {
    name: merged.name,
    kind: merged.kind,
    definitionId: merged.id,
  });
  world.addComponent(entityId, Component.ABILITY_SCORES, merged.abilityScores);
  world.addComponent(entityId, Component.HEALTH, {
    current: merged.hitPoints,
    max: merged.hitPoints,
  });
  world.addComponent(entityId, Component.ARMOR_CLASS, { value: merged.armorClass });
  world.addComponent(entityId, Component.COMBATANT, {
    initiativeBonus: merged.initiativeBonus ?? 0,
    attack: structuredClone(merged.attack),
    defeated: false,
  });
  world.addComponent(entityId, Component.CONTROLLER, {
    type: merged.controller ?? "ai",
  });
  world.addComponent(entityId, Component.EQUIPMENT, {
    weaponId: merged.weaponId ?? null,
  });
  world.addComponent(entityId, Component.RELATIONSHIP, {
    faction: merged.faction,
  });

  return entityId;
}

function mergeDefinition(definition, overrides) {
  return {
    ...definition,
    ...overrides,
    abilityScores: { ...definition.abilityScores, ...overrides.abilityScores },
    attack: { ...definition.attack, ...overrides.attack },
  };
}

function validateDefinition(definition) {
  for (const key of ["id", "kind", "name", "hitPoints", "armorClass", "abilityScores", "attack", "faction"]) {
    if (definition[key] === undefined) throw new Error(`Combatant definition lacks ${key}`);
  }
}
