import { Component } from "../components/types.js";
import { getAttackProfile } from "../rules/equipmentRules.js";

/** Exposes command-relevant facts without exposing the mutable World. */
export function getActionContext(session) {
  const snapshot = session.snapshot();
  const byId = new Map(snapshot.participants.map((participant) => [participant.entityId, participant]));
  const active = byId.get(snapshot.activeEntityId) ?? null;
  const participants = snapshot.participants.map((participant) => ({
    entityId: participant.entityId,
    name: participant.identity.name,
    aliases: participant.identity.aliases ?? [],
    kind: participant.identity.kind,
    definitionId: participant.identity.definitionId,
    description: participant.identity.description,
    health: participant.health,
    armorClass: participant.armorClass,
    controller: participant.controller,
    faction: participant.faction,
    conditions: participant.conditions,
    defeated: participant.defeated,
  }));
  const validTargets = active && !active.defeated
    ? participants.filter((participant) => !participant.defeated && participant.faction !== active.faction).map(({ entityId }) => entityId)
    : [];
  const availableItems = active ? getAvailableItems(session, active.entityId) : [];
  return {
    status: snapshot.status,
    activeActor: active,
    availableActions: [
      { type: "ATTACK", validTargetIds: validTargets },
      { type: "DODGE" },
      { type: "PASS" },
    ],
    participants,
    availableItems,
    availableSpells: [],
  };
}

function getAvailableItems(session, entityId) {
  const equipment = session.world.requireComponent(entityId, Component.EQUIPMENT);
  const inventory = session.world.requireComponent(entityId, Component.INVENTORY).items;
  const items = [equipment.weapon, equipment.armor, equipment.shield, ...inventory].filter(Boolean);
  const unique = new Map(items.map((item) => [item.id, item]));
  return [...unique.values()].map((item) => {
    const attack = item.attack ?? item;
    const profile = item.id === equipment.weapon?.id ? getAttackProfile(session.world, entityId) : null;
    return {
      id: item.id,
      name: item.name,
      aliases: item.aliases ?? [],
      kind: item.kind ?? "item",
      description: item.description ?? "Un objeto disponible para este combatiente.",
      equipped: [equipment.weapon, equipment.armor, equipment.shield].some((equipped) => equipped?.id === item.id),
      damageNotation: profile?.damageDie ? `1d${profile.damageDie}` : attack.damageDie ? `1d${attack.damageDie}` : null,
      damageType: profile?.damageType ?? attack.damageType ?? null,
    };
  });
}
