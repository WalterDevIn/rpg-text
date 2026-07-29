import { World } from "../ecs/world.js";
import { Component } from "../components/types.js";
import { EventLog } from "../events/eventLog.js";
import { createSeededRandom } from "../random/seededRandom.js";
import { createCombatant } from "../entities/createCombatant.js";
import { resolveAttack } from "../systems/attackSystem.js";

export class CombatSession {
  constructor({ seed = 1 } = {}) {
    this.world = new World();
    this.events = new EventLog();
    this.random = createSeededRandom(seed);
    this.turnOrder = [];
    this.activeTurnIndex = -1;
    this.round = 0;
    this.status = "SETUP";
    this.history = [];
  }

  addParticipant(definition, overrides = {}) {
    if (this.status !== "SETUP") throw new Error("Participants can only be added during setup");
    const entityId = createCombatant(this.world, definition, overrides);
    this.events.append("PARTICIPANT_ADDED", { entityId, definitionId: definition.id });
    return entityId;
  }

  start() {
    if (this.status !== "SETUP") throw new Error("Combat already started");
    const participants = this.world.query(Component.COMBATANT);
    const factions = new Set(participants.map((id) => this.world.requireComponent(id, Component.RELATIONSHIP).faction));
    if (participants.length < 2 || factions.size < 2) throw new Error("Combat requires at least two opposing participants");

    this.turnOrder = participants.map((entityId) => {
      const bonus = this.world.requireComponent(entityId, Component.COMBATANT).initiativeBonus;
      const roll = this.random.roll(20);
      const total = roll + bonus;
      this.events.append("DICE_ROLLED", { actorId: entityId, purpose: "INITIATIVE", notation: "1d20", naturalRoll: roll, modifier: bonus, total });
      return { entityId, total };
    }).sort((a, b) => b.total - a.total || a.entityId.localeCompare(b.entityId)).map((entry) => entry.entityId);

    this.status = "ACTIVE";
    this.activeTurnIndex = 0;
    this.round = 1;
    this.events.append("COMBAT_STARTED", { turnOrder: this.turnOrder });
    this.#openTurn();
  }

  get activeEntityId() {
    return this.turnOrder[this.activeTurnIndex] ?? null;
  }

  submitIntent(intent) {
    const validation = this.#validateIntent(intent);
    if (!validation.ok) {
      const result = { ok: false, reason: validation.reason };
      this.events.append("INTENT_REJECTED", { intent: structuredClone(intent), reason: validation.reason });
      this.history.push({ intent: structuredClone(intent), result, eventSequence: this.events.all().at(-1)?.sequence ?? 0 });
      return result;
    }

    let result;
    if (intent.type === "ATTACK") {
      result = resolveAttack({ world: this.world, events: this.events, random: this.random, actorId: intent.actorId, targetId: intent.targetId });
    } else if (intent.type === "DODGE") {
      const conditions = this.world.requireComponent(intent.actorId, Component.CONDITIONS);
      if (!conditions.values.includes("DODGING")) conditions.values.push("DODGING");
      this.events.append("CONDITION_APPLIED", { entityId: intent.actorId, condition: "DODGING" });
      result = { ok: true };
    } else {
      this.events.append("TURN_PASSED", { entityId: intent.actorId });
      result = { ok: true };
    }

    this.history.push({ intent: structuredClone(intent), result: structuredClone(result), eventSequence: this.events.all().at(-1)?.sequence ?? 0 });
    if (result.ok !== false) {
      this.#updateOutcome();
      if (this.status === "ACTIVE") this.#advanceTurn();
    }
    return result;
  }

  snapshot() {
    return {
      status: this.status,
      round: this.round,
      activeEntityId: this.activeEntityId,
      turnOrder: [...this.turnOrder],
      participants: this.world.query(Component.IDENTITY, Component.HEALTH, Component.COMBATANT).map((entityId) => ({
        entityId,
        identity: structuredClone(this.world.requireComponent(entityId, Component.IDENTITY)),
        health: structuredClone(this.world.requireComponent(entityId, Component.HEALTH)),
        armorClass: this.world.requireComponent(entityId, Component.ARMOR_CLASS).value,
        controller: this.world.requireComponent(entityId, Component.CONTROLLER).type,
        faction: this.world.requireComponent(entityId, Component.RELATIONSHIP).faction,
        conditions: [...this.world.requireComponent(entityId, Component.CONDITIONS).values],
        defeated: this.world.requireComponent(entityId, Component.COMBATANT).defeated,
      })),
      history: structuredClone(this.history),
    };
  }

  #validateIntent(intent) {
    if (this.status !== "ACTIVE") return { ok: false, reason: "COMBAT_NOT_ACTIVE" };
    if (!intent || !["ATTACK", "DODGE", "PASS"].includes(intent.type)) return { ok: false, reason: "ACTION_NOT_AVAILABLE" };
    if (!this.world.hasEntity(intent.actorId)) return { ok: false, reason: "INVALID_ACTOR" };
    if (intent.actorId !== this.activeEntityId) return { ok: false, reason: "NOT_ACTOR_TURN" };
    if (this.world.requireComponent(intent.actorId, Component.COMBATANT).defeated) return { ok: false, reason: "ACTOR_DEFEATED" };
    if (intent.type === "ATTACK") {
      if (!this.world.hasEntity(intent.targetId)) return { ok: false, reason: "INVALID_TARGET" };
      if (this.world.requireComponent(intent.targetId, Component.COMBATANT).defeated) return { ok: false, reason: "TARGET_DEFEATED" };
      const actorFaction = this.world.requireComponent(intent.actorId, Component.RELATIONSHIP).faction;
      const targetFaction = this.world.requireComponent(intent.targetId, Component.RELATIONSHIP).faction;
      if (actorFaction === targetFaction) return { ok: false, reason: "INVALID_TARGET" };
    }
    return { ok: true };
  }

  #advanceTurn() {
    for (let attempts = 0; attempts < this.turnOrder.length; attempts += 1) {
      const previousIndex = this.activeTurnIndex;
      this.activeTurnIndex = (this.activeTurnIndex + 1) % this.turnOrder.length;
      if (this.activeTurnIndex <= previousIndex) {
        this.round += 1;
        this.events.append("ROUND_STARTED", { round: this.round });
      }
      const combatant = this.world.requireComponent(this.activeEntityId, Component.COMBATANT);
      if (!combatant.defeated) {
        this.#openTurn();
        return;
      }
    }
  }

  #openTurn() {
    const conditions = this.world.requireComponent(this.activeEntityId, Component.CONDITIONS);
    if (conditions.values.includes("DODGING")) {
      conditions.values = conditions.values.filter((value) => value !== "DODGING");
      this.events.append("CONDITION_EXPIRED", { entityId: this.activeEntityId, condition: "DODGING" });
    }
    this.events.append("TURN_STARTED", { entityId: this.activeEntityId, round: this.round });
  }

  #updateOutcome() {
    const livingFactions = new Set(this.world.query(Component.COMBATANT, Component.RELATIONSHIP)
      .filter((entityId) => !this.world.requireComponent(entityId, Component.COMBATANT).defeated)
      .map((entityId) => this.world.requireComponent(entityId, Component.RELATIONSHIP).faction));
    if (livingFactions.size <= 1) {
      this.status = "FINISHED";
      this.events.append("COMBAT_FINISHED", { winnerFaction: livingFactions.values().next().value ?? null });
    }
  }
}
