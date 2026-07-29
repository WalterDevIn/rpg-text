import { Component } from "../components/types.js";

export function abilityModifier(score) {
  return Math.floor((score - 10) / 2);
}

export function getEquippedWeapon(world, entityId) {
  const equipment = world.requireComponent(entityId, Component.EQUIPMENT);
  return equipment.weapon ?? null;
}

export function getAttackProfile(world, entityId) {
  const abilities = world.requireComponent(entityId, Component.ABILITY_SCORES);
  const weapon = getEquippedWeapon(world, entityId);

  if (!weapon) {
    const modifier = abilityModifier(abilities.strength);
    return {
      id: "unarmed-strike",
      name: "Unarmed strike",
      attackBonus: modifier,
      damageDie: null,
      damageBonus: modifier,
      damageType: "bludgeoning",
    };
  }

  const ability = weapon.ability ?? "strength";
  const modifier = abilityModifier(abilities[ability]);
  return {
    ...weapon,
    attackBonus: modifier + (weapon.attackBonus ?? 0),
    damageBonus: modifier + (weapon.damageBonus ?? 0),
  };
}

export function calculateArmorClass(world, entityId) {
  const abilities = world.requireComponent(entityId, Component.ABILITY_SCORES);
  const equipment = world.requireComponent(entityId, Component.EQUIPMENT);
  const dexterity = abilityModifier(abilities.dexterity);
  const armor = equipment.armor;

  let armorClass = armor
    ? armor.baseArmorClass + (armor.addDexterity ? dexterity : 0)
    : 10 + dexterity;

  if (equipment.shield) armorClass += equipment.shield.armorClassBonus;
  return armorClass;
}
