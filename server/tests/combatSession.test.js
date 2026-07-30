import test from "node:test";
import assert from "node:assert/strict";
import { CombatSession } from "../src/game/simulation/combatSession.js";
import { humanFighter } from "../src/content/characters/humanFighter.js";
import { goblin } from "../src/content/creatures/goblin.js";

function createCombat(seed = 2026) {
  const session = new CombatSession({ seed });
  const heroId = session.addParticipant(humanFighter);
  const goblinId = session.addParticipant(goblin);
  session.start();
  return { session, heroId, goblinId };
}

test("combat produces initiative, turns, attack and dice events", () => {
  const { session, heroId, goblinId } = createCombat();
  const actorId = session.activeEntityId;
  const targetId = actorId === heroId ? goblinId : heroId;

  session.submitIntent({ type: "ATTACK", actorId, targetId });
  const types = session.events.all().map((event) => event.type);

  assert.ok(types.includes("COMBAT_STARTED"));
  assert.ok(types.includes("TURN_STARTED"));
  assert.ok(types.includes("INTENT_DECLARED"));
  assert.ok(types.includes("DICE_ROLLED"));
});

test("combat is reproducible with the same seed", () => {
  const first = createCombat(77);
  const second = createCombat(77);

  for (const entry of [first, second]) {
    const actorId = entry.session.activeEntityId;
    const targetId = actorId === entry.heroId ? entry.goblinId : entry.heroId;
    entry.session.submitIntent({ type: "ATTACK", actorId, targetId });
  }

  const withoutSequence = (events) => events.map(({ sequence, ...event }) => event);
  assert.deepEqual(withoutSequence(first.session.events.all()), withoutSequence(second.session.events.all()));
});

test("combat finishes when only one faction remains", () => {
  const fragileGoblin = { ...goblin, hitPoints: 1, armorClass: 1 };
  const session = new CombatSession({ seed: 5 });
  const heroId = session.addParticipant(humanFighter, { initiativeBonus: 100 });
  const goblinId = session.addParticipant(fragileGoblin);

  session.start();
  session.submitIntent({ type: "ATTACK", actorId: heroId, targetId: goblinId });

  assert.equal(session.status, "FINISHED");
  assert.equal(session.snapshot().participants.find((participant) => participant.entityId === goblinId).defeated, true);
  assert.equal(session.events.all().at(-1).type, "COMBAT_FINISHED");
});
