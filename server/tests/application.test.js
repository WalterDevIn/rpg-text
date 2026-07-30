import test from "node:test";
import assert from "node:assert/strict";
import {
  createCombatSession,
  getCombatEvents,
  getCombatSnapshot,
  listEncounterCharacters,
  listEncounterCreatures,
  listEncounterScenarios,
  submitCombatIntent,
  validateEncounterSetup,
} from "../src/application/index.js";
import { humanFighter } from "../src/content/characters/humanFighter.js";
import { goblin } from "../src/content/creatures/goblin.js";

test("application boundary creates, reads, and advances a combat session", () => {
  const created = createCombatSession({ seed: 42, participants: [
    { definition: humanFighter, overrides: { initiativeBonus: 100 } },
    { definition: goblin, overrides: { initiativeBonus: -100 } },
  ] });
  assert.equal(created.ok, true);
  assert.equal(getCombatSnapshot(created.sessionId).ok, true);
  const actor = created.snapshot.activeEntityId;
  const target = created.snapshot.participants.find(({ entityId }) => entityId !== actor).entityId;
  const submitted = submitCombatIntent(created.sessionId, { type: "PASS", actorId: actor });
  assert.equal(submitted.ok, true);
  assert.ok(submitted.events.length > 0);
  assert.ok(submitted.automaticActions.length > 0);
  assert.ok(getCombatEvents(created.sessionId).events.length > 0);
  assert.equal(submitCombatIntent(created.sessionId, { type: "ATTACK", actorId: target, targetId: actor }).error.code, "NOT_ACTOR_TURN");
});

test("application boundary returns a structured missing-session error", () => {
  assert.deepEqual(getCombatSnapshot("missing"), { ok: false, error: { code: "SESSION_NOT_FOUND", message: "SESSION_NOT_FOUND" } });
});

test("encounter catalog and validation use server-owned content", () => {
  const characters = listEncounterCharacters().characters;
  const creatures = listEncounterCreatures().creatures;
  const scenarios = listEncounterScenarios().scenarios;
  assert.deepEqual(characters.map(({ id }) => id), ["human-fighter", "human-wizard"]);
  assert.deepEqual(creatures.map(({ id }) => id), ["goblin", "cave-rat", "slime"]);
  assert.equal(scenarios[0].id, "open-field");

  const invalid = validateEncounterSetup({ characterIds: [characters[0].id], creatureIds: [], assignments: { [characters[0].id]: "party" }, scenarioId: null });
  assert.equal(invalid.ok, false);
  assert.ok(invalid.errors.some(({ code }) => code === "CREATURE_REQUIRED"));
});

test("valid encounter setup creates a combat-ready session", () => {
  const result = createCombatSession({
    seed: 2026,
    characterIds: ["human-fighter"],
    creatureIds: ["goblin", "cave-rat"],
    assignments: { "human-fighter": "party", goblin: "hostiles", "cave-rat": "hostiles" },
    scenarioId: "open-field",
  });
  assert.equal(result.ok, true);
  assert.equal(result.snapshot.status, "ACTIVE");
  assert.equal(result.snapshot.participants.length, 3);
});

test("encounter setup rejects an unknown scenario and incomplete sides", () => {
  const result = createCombatSession({
    characterIds: ["human-fighter"],
    creatureIds: ["goblin"],
    assignments: { "human-fighter": "party", goblin: "party" },
    scenarioId: "missing",
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.error.code, "INVALID_ENCOUNTER");
  assert.ok(result.errors.some(({ code }) => code === "SCENARIO_REQUIRED"));
  assert.ok(result.errors.some(({ code }) => code === "OPPOSING_SIDES_REQUIRED"));
});
