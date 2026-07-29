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
    this.status = "SETUP";
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
    if (participants.length < 2) throw new Error("Combat requires at least two participants");

    this.turnOrder = participants
      .map((entityId) => ({
        entityId,
        roll: this.random.roll(20),
        bonus: this.world.requireComponent(entityId, Component.COMBATANT).initiativeBonus,
      }))
      .map((entry) => ({ ...entry, total: entry.roll + entry.bonus }))
      .sort((a, b) => b.total - a.total || a.entityId.localeCompare(b.entityId))
      .map((entry) => {
        this.events.append("DICE_ROLLED", {
          actorId: entry.entityId,
          purpose: "INITIATIVE",
          notation: "1d20",
          naturalRoll: entry.roll,
          modifier: entry.bonus,
          total: entry.total,
        });
        return entry.entityId;
      });

    this.status = "ACTIVE";
    this.activeTurnIndex = 0;
    this.events.append("COMBAT_STARTED", { turnOrder: this.turnOrder });
    this.#openTurn();
  }

  get activeEntityId() {
    return this.turnOrder[this.activeTurnIndex] ?? null;
  }

  submitIntent(intent) {
    if (this.status !== "ACTIVE") throw new Error("Combat is not active");
    if (intent.actorId !== this.activeEntityId) throw new Error("It is not this actor's turn");
    if (intent.type !== "ATTACK") throw new Error(`Unsupported intent type: ${intent.type}`);

    const result = resolveAttack({
      world: this.world,
      events: this.events,
      random: this.random,
      actorId: intent.actorId,
      targetId: intent.targetId,
    });

    this.#updateOutcome();
    if (this.status === "ACTIVE") this.#advanceTurn();
    return result;
  }

  snapshot() {
    return {
      status: this.status,
      activeEntityId: this.activeEntityId,
      participants: this.world
        .query(Component.IDENTITY, Component.HEALTH, Component.COMBATANT)
        .map((entityId) => ({
          entityId,
          identity: structuredClone(this.world.requireComponent(entityId, Component.IDENTITY)),
          health: structuredClone(this.world.requireComponent(entityId, Component.HEALTH)),
          defeated: this.world.requireComponent(entityId, Component.COMBATANT).defeated,
        })),
    };
  }

  #advanceTurn() {
    for (let attempts = 0; attempts < this.turnOrder.length; attempts += 1) {
      this.activeTurnIndex = (this.activeTurnIndex + 1) % this.turnOrder.length;
      const combatant = this.world.requireComponent(this.activeEntityId, Component.COMBATANT);
      if (!combatant.defeated) {
        this.#openTurn();
        return;
      }
    }
  }

  #openTurn() {
    this.events.append("TURN_STARTED", { entityId: this.activeEntityId });
  }

  #updateOutcome() {
    const livingFactions = new Set(
      this.world
        .query(Component.COMBATANT, Component.RELATIONSHIP)
        .filter((entityId) => !this.world.requireComponent(entityId, Component.COMBATANT).defeated)
        .map((entityId) => this.world.requireComponent(entityId, Component.RELATIONSHIP).faction),
    );

    if (livingFactions.size <= 1) {
      this.status = "FINISHED";
      const winnerFaction = livingFactions.values().next().value ?? null;
      this.events.append("COMBAT_FINISHED", { winnerFaction });
    }
  }
}
