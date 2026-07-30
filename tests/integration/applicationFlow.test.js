import test from "node:test";
import assert from "node:assert/strict";
import { createCombatSession, submitCombatIntent } from "../../server/src/application/index.js";
import { humanFighter } from "../../server/src/content/characters/humanFighter.js";
import { goblin } from "../../server/src/content/creatures/goblin.js";

test("application flow exposes authoritative events and snapshot", () => {
  const created = createCombatSession({ seed: 7, participants: [{ definition: humanFighter }, { definition: goblin }] });
  const actor = created.snapshot.activeEntityId;
  const result = submitCombatIntent(created.sessionId, { type: "PASS", actorId: actor });
  assert.equal(result.ok, true);
  assert.ok(result.events.some((event) => event.type === "TURN_STARTED"));
  assert.ok(result.snapshot.round >= 1);
});
