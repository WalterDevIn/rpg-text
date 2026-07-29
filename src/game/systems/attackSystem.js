import { Component } from "../components/types.js";

export function resolveAttack({ world, events, random, actorId, targetId }) {
  const actorIdentity = world.requireComponent(actorId, Component.IDENTITY);
  const targetIdentity = world.requireComponent(targetId, Component.IDENTITY);
  const actorCombatant = world.requireComponent(actorId, Component.COMBATANT);
  const targetCombatant = world.requireComponent(targetId, Component.COMBATANT);
  const targetArmorClass = world.requireComponent(targetId, Component.ARMOR_CLASS).value;
  const equipment = world.requireComponent(actorId, Component.EQUIPMENT);
  const attack = equipment.weapon?.attack ?? actorCombatant.unarmed;

  if (actorCombatant.defeated) return invalid("ACTOR_DEFEATED");
  if (targetCombatant.defeated) return invalid("TARGET_DEFEATED");
  if (actorId === targetId) return invalid("INVALID_TARGET");

  events.append("INTENT_DECLARED", { actorId, action: "ATTACK", targetId, instrumentId: equipment.weapon?.id ?? null });

  const attackRolls = rollAttackDice(random, hasCondition(world, targetId, "DODGING"));
  const naturalRoll = Math.min(...attackRolls);
  const total = naturalRoll + (attack.attackBonus ?? actorCombatant.proficiencyBonus);
  events.append("DICE_ROLLED", {
    actorId,
    purpose: "ATTACK",
    notation: attackRolls.length === 2 ? "2d20 keep lowest" : "1d20",
    rolls: attackRolls,
    naturalRoll,
    modifier: attack.attackBonus ?? actorCombatant.proficiencyBonus,
    total,
  });

  if (naturalRoll !== 20 && total < targetArmorClass) {
    events.append("ATTACK_MISSED", { actorId, targetId, total, armorClass: targetArmorClass });
    return { ok: true, hit: false, damage: 0, trace: { attackRolls, total, targetArmorClass } };
  }

  const damageRoll = attack.damageDie === 1 ? 1 : random.roll(attack.damageDie);
  const damage = Math.max(1, damageRoll + (attack.damageBonus ?? 0));
  events.append("DICE_ROLLED", {
    actorId,
    purpose: "DAMAGE",
    notation: `1d${attack.damageDie}`,
    naturalRoll: damageRoll,
    modifier: attack.damageBonus ?? 0,
    total: damage,
  });

  applyDamage({ world, events, targetId, sourceId: actorId, amount: damage, damageType: attack.damageType });
  events.append("ATTACK_HIT", { actorId, targetId, total, armorClass: targetArmorClass, damage });
  return { ok: true, hit: true, damage, trace: { attackRolls, total, targetArmorClass, damageRoll } };
}

function invalid(reason) {
  return { ok: false, reason };
}

function hasCondition(world, entityId, condition) {
  return world.requireComponent(entityId, Component.CONDITIONS).values.includes(condition);
}

function rollAttackDice(random, disadvantage) {
  return disadvantage ? [random.roll(20), random.roll(20)] : [random.roll(20)];
}

function applyDamage({ world, events, targetId, sourceId, amount, damageType }) {
  const health = world.requireComponent(targetId, Component.HEALTH);
  const combatant = world.requireComponent(targetId, Component.COMBATANT);
  health.current = Math.max(0, health.current - amount);
  events.append("DAMAGE_APPLIED", { sourceId, targetId, amount, damageType, remainingHitPoints: health.current });
  if (health.current === 0 && !combatant.defeated) {
    combatant.defeated = true;
    events.append("COMBATANT_DEFEATED", { entityId: targetId, sourceId });
  }
}
