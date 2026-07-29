import { Component } from "../components/types.js";

export function abilityModifier(score) {
  return Math.floor((score - 10) / 2);
}

export function getEquippedWeapon(world, entityId) {
  return world.requireComponent(entityId, Component.EQUIPMENT).weapon ?? null;
}

export function getAttackProfile(world, entityId) {
  const abilities = world.requireComponent(entityId, Component.ABILITY_SCORES);
  const combatant = world.requireComponent(entityId, Component.COMBATANT);
  const weapon = getEquippedWeapon(world, entityId);

  if (!weapon) {
    const modifier = abilityModifier(abilities.strength);
    return {
      id: "unarmed-strike",
      name: "Unarmed strike",
      attackBonus: combatant.proficiencyBonus + modifier,
      damageDie: null,
      damageBonus: Math.max(1, modifier),
      damageType: "bludgeoning",
    };
  }

  const base = weapon.attack ?? weapon;
  const abilityName = weapon.ability ?? "strength";
  const abilityBonus = abilityModifier(abilities[abilityName]);
  return {
    id: weapon.id,
    name: weapon.name,
    attackBonus: base.attackBonus ?? combatant.proficiencyBonus + abilityBonus,
    damageDie: base.damageDie ?? null,
    damageBonus: base.damageBonus ?? abilityBonus,
    damageType: base.damageType ?? "bludgeoning",
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
