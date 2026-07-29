import { Component } from "../components/types.js";

export function resolveAttack({ world, events, random, actorId, targetId }) {
  const actorIdentity = world.requireComponent(actorId, Component.IDENTITY);
  const targetIdentity = world.requireComponent(targetId, Component.IDENTITY);
  const actorCombatant = world.requireComponent(actorId, Component.COMBATANT);
  const targetCombatant = world.requireComponent(targetId, Component.COMBATANT);
  const targetArmorClass = world.requireComponent(targetId, Component.ARMOR_CLASS).value;

  if (actorCombatant.defeated) throw new Error(`${actorIdentity.name} is defeated and cannot act`);
  if (targetCombatant.defeated) throw new Error(`${targetIdentity.name} is already defeated`);

  events.append("INTENT_DECLARED", { actorId, action: "ATTACK", targetId });

  const naturalRoll = random.roll(20);
  const total = naturalRoll + actorCombatant.attack.attackBonus;
  events.append("DICE_ROLLED", {
    actorId,
    purpose: "ATTACK",
    notation: "1d20",
    naturalRoll,
    modifier: actorCombatant.attack.attackBonus,
    total,
  });

  if (naturalRoll !== 20 && total < targetArmorClass) {
    events.append("ATTACK_MISSED", { actorId, targetId, total, armorClass: targetArmorClass });
    return { hit: false, damage: 0 };
  }

  const damageRoll = random.roll(actorCombatant.attack.damageDie);
  const damage = Math.max(1, damageRoll + actorCombatant.attack.damageBonus);
  events.append("DICE_ROLLED", {
    actorId,
    purpose: "DAMAGE",
    notation: `1d${actorCombatant.attack.damageDie}`,
    naturalRoll: damageRoll,
    modifier: actorCombatant.attack.damageBonus,
    total: damage,
  });

  applyDamage({
    world,
    events,
    targetId,
    sourceId: actorId,
    amount: damage,
    damageType: actorCombatant.attack.damageType,
  });
  events.append("ATTACK_HIT", { actorId, targetId, total, armorClass: targetArmorClass, damage });
  return { hit: true, damage };
}

function applyDamage({ world, events, targetId, sourceId, amount, damageType }) {
  const health = world.requireComponent(targetId, Component.HEALTH);
  const combatant = world.requireComponent(targetId, Component.COMBATANT);
  health.current = Math.max(0, health.current - amount);
  events.append("DAMAGE_APPLIED", {
    sourceId,
    targetId,
    amount,
    damageType,
    remainingHitPoints: health.current,
  });

  if (health.current === 0 && !combatant.defeated) {
    combatant.defeated = true;
    events.append("COMBATANT_DEFEATED", { entityId: targetId, sourceId });
  }
}
