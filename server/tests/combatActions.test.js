import test from "node:test";
import assert from "node:assert/strict";
import { CombatBuilder } from "../src/game/simulation/combatBuilder.js";
import { Component } from "../src/game/components/types.js";
import { humanFighter } from "../src/content/characters/humanFighter.js";
import { humanWizard } from "../src/content/characters/humanWizard.js";
import { goblin } from "../src/content/creatures/goblin.js";

function createMultiCombat(seed = 12) {
  const { session, ids } = new CombatBuilder({ seed })
    .add(humanFighter, { initiativeBonus: 100 })
    .add(humanWizard)
    .add(goblin)
    .build();
  session.start();
  return { session, heroId: ids[0], wizardId: ids[1], goblinId: ids[2] };
}

test("combat builder creates a configurable multi-participant encounter", () => {
  const { session } = createMultiCombat();
  assert.equal(session.snapshot().participants.length, 3);
  assert.equal(session.round, 1);
  assert.equal(session.turnOrder.length, 3);
});

test("pass advances the turn and records trace history", () => {
  const { session, heroId } = createMultiCombat();
  const result = session.submitIntent({ type: "PASS", actorId: heroId });
  assert.equal(result.ok, true);
  assert.notEqual(session.activeEntityId, heroId);
  assert.equal(session.snapshot().history.at(-1).intent.type, "PASS");
  assert.ok(session.events.all().some((event) => event.type === "TURN_PASSED"));
});

test("dodge applies disadvantage until the actor next turn", () => {
  const { session, heroId } = createMultiCombat();
  session.submitIntent({ type: "DODGE", actorId: heroId });
  assert.ok(session.world.requireComponent(heroId, Component.CONDITIONS).values.includes("DODGING"));

  while (session.status === "ACTIVE" && session.activeEntityId !== heroId) {
    session.submitIntent({ type: "PASS", actorId: session.activeEntityId });
  }

  assert.equal(session.world.requireComponent(heroId, Component.CONDITIONS).values.includes("DODGING"), false);
  assert.ok(session.events.all().some((event) => event.type === "CONDITION_EXPIRED"));
});

test("invalid intents are rejected without consuming the turn", () => {
  const { session, heroId, wizardId } = createMultiCombat();
  const result = session.submitIntent({ type: "ATTACK", actorId: heroId, targetId: wizardId });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "INVALID_TARGET");
  assert.equal(session.activeEntityId, heroId);
  assert.ok(session.events.all().some((event) => event.type === "INTENT_REJECTED"));
});
