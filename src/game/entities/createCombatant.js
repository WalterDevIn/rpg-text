import { Component } from "../components/types.js";
import { calculateArmorClass } from "../rules/equipmentRules.js";

export function createCombatant(world, definition, overrides = {}) {
  validateDefinition(definition);
  const merged = mergeDefinition(definition, overrides);
  const entityId = world.createEntity(merged.kind);

  world.addComponent(entityId, Component.IDENTITY, {
    name: merged.name,
    kind: merged.kind,
    definitionId: merged.id,
  });
  world.addComponent(entityId, Component.ABILITY_SCORES, structuredClone(merged.abilityScores));
  world.addComponent(entityId, Component.HEALTH, {
    current: merged.hitPoints,
    max: merged.hitPoints,
  });
  world.addComponent(entityId, Component.COMBATANT, {
    initiativeBonus: merged.initiativeBonus ?? 0,
    proficiencyBonus: merged.proficiencyBonus ?? 2,
    defeated: false,
  });
  world.addComponent(entityId, Component.CONTROLLER, { type: merged.controller ?? "manual" });
  world.addComponent(entityId, Component.INVENTORY, {
    items: structuredClone(merged.inventory ?? []),
  });
  world.addComponent(entityId, Component.EQUIPMENT, {
    weapon: merged.weapon ? structuredClone(merged.weapon) : null,
    armor: merged.armor ? structuredClone(merged.armor) : null,
    shield: merged.shield ? structuredClone(merged.shield) : null,
  });
  world.addComponent(entityId, Component.CONDITIONS, { values: [] });
  world.addComponent(entityId, Component.RELATIONSHIP, { faction: merged.faction });
  world.addComponent(entityId, Component.ARMOR_CLASS, {
    value: merged.armorClass ?? calculateArmorClass(world, entityId),
  });

  return entityId;
}

function mergeDefinition(definition, overrides) {
  return {
    ...definition,
    ...overrides,
    abilityScores: { ...definition.abilityScores, ...overrides.abilityScores },
    inventory: overrides.inventory ?? definition.inventory,
    weapon: overrides.weapon === undefined ? definition.weapon : overrides.weapon,
    armor: overrides.armor === undefined ? definition.armor : overrides.armor,
    shield: overrides.shield === undefined ? definition.shield : overrides.shield,
  };
}

function validateDefinition(definition) {
  for (const key of ["id", "kind", "name", "hitPoints", "abilityScores", "faction"]) {
    if (definition[key] === undefined) throw new Error(`Combatant definition lacks ${key}`);
  }
}
