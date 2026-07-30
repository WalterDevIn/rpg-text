import { Component } from "../components/types.js";
import { getAttackProfile } from "../rules/equipmentRules.js";

export function resolveAttack({ world, events, random, actorId, targetId }) {
  const actorCombatant = world.requireComponent(actorId, Component.COMBATANT);
  const targetCombatant = world.requireComponent(targetId, Component.COMBATANT);
  if (actorCombatant.defeated) return invalid("ACTOR_DEFEATED");
  if (targetCombatant.defeated) return invalid("TARGET_DEFEATED");
  if (actorId === targetId) return invalid("INVALID_TARGET");

  const attack = getAttackProfile(world, actorId);
  const targetArmorClass = world.requireComponent(targetId, Component.ARMOR_CLASS).value;
  const weapon = world.requireComponent(actorId, Component.EQUIPMENT).weapon;
  events.append("INTENT_DECLARED", { actorId, action: "ATTACK", targetId, instrumentId: weapon?.id ?? null, instrumentName: weapon?.name ?? "Unarmed strike" });

  const attackRolls = rollAttackDice(random, hasCondition(world, targetId, "DODGING"));
  const naturalRoll = Math.min(...attackRolls);
  const total = naturalRoll + attack.attackBonus;
  events.append("DICE_ROLLED", {
    actorId,
    purpose: "ATTACK",
    notation: attackRolls.length === 2 ? "2d20 keep lowest" : "1d20",
    rolls: attackRolls,
    naturalRoll,
    modifier: attack.attackBonus,
    total,
  });

  if (naturalRoll !== 20 && total < targetArmorClass) {
    events.append("ATTACK_MISSED", { actorId, targetId, total, armorClass: targetArmorClass });
    return { ok: true, hit: false, damage: 0, trace: { attackRolls, total, targetArmorClass } };
  }

  const damageRoll = attack.damageDie ? random.roll(attack.damageDie) : 1;
  const damage = Math.max(1, damageRoll + attack.damageBonus);
  events.append("DICE_ROLLED", {
    actorId,
    purpose: "DAMAGE",
    notation: attack.damageDie ? `1d${attack.damageDie}` : "1",
    naturalRoll: damageRoll,
    modifier: attack.damageBonus,
    total: damage,
    damageType: attack.damageType,
    targetId,
    sourceId: actorId,
    instrumentId: weapon?.id ?? "unarmed-strike",
  });
  applyDamage({ world, events, targetId, sourceId: actorId, amount: damage, damageType: attack.damageType, notation: attack.damageDie ? `1d${attack.damageDie}` : "1", roll: damageRoll, modifier: attack.damageBonus });
  events.append("ATTACK_HIT", { actorId, targetId, total, armorClass: targetArmorClass, damage, damageType: attack.damageType, instrumentId: weapon?.id ?? "unarmed-strike" });
  return { ok: true, hit: true, damage, trace: { attackRolls, total, targetArmorClass, damageRoll } };
}

function invalid(reason) { return { ok: false, reason }; }
function hasCondition(world, entityId, condition) {
  return world.requireComponent(entityId, Component.CONDITIONS).values.includes(condition);
}
function rollAttackDice(random, disadvantage) {
  return disadvantage ? [random.roll(20), random.roll(20)] : [random.roll(20)];
}
function applyDamage({ world, events, targetId, sourceId, amount, damageType, notation, roll, modifier }) {
  const health = world.requireComponent(targetId, Component.HEALTH);
  const combatant = world.requireComponent(targetId, Component.COMBATANT);
  health.current = Math.max(0, health.current - amount);
  events.append("DAMAGE_APPLIED", { sourceId, targetId, amount, damageType, notation, rolls: [roll], modifier, remainingHitPoints: health.current });
  if (health.current === 0 && !combatant.defeated) {
    combatant.defeated = true;
    events.append("COMBATANT_DEFEATED", { entityId: targetId, sourceId });
  }
}
