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
    proficiencyBonus: merged.proficiencyBonus ?? 2,
    unarmed: merged.unarmed ?? { damageDie: 1, damageBonus: 0, damageType: "bludgeoning" },
    defeated: false,
  });
  world.addComponent(entityId, Component.CONTROLLER, { type: merged.controller ?? "manual" });
  world.addComponent(entityId, Component.INVENTORY, {
    itemIds: [...(merged.inventory ?? [])],
  });
  world.addComponent(entityId, Component.EQUIPMENT, {
    weapon: merged.weapon ? structuredClone(merged.weapon) : null,
    armor: merged.armor ? structuredClone(merged.armor) : null,
    shield: merged.shield ? structuredClone(merged.shield) : null,
  });
  world.addComponent(entityId, Component.CONDITIONS, { values: [] });
  world.addComponent(entityId, Component.RELATIONSHIP, { faction: merged.faction });

  return entityId;
}

function mergeDefinition(definition, overrides) {
  return {
    ...definition,
    ...overrides,
    abilityScores: { ...definition.abilityScores, ...overrides.abilityScores },
  };
}

function validateDefinition(definition) {
  for (const key of ["id", "kind", "name", "hitPoints", "armorClass", "abilityScores", "faction"]) {
    if (definition[key] === undefined) throw new Error(`Combatant definition lacks ${key}`);
  }
}
