import test from "node:test";
import assert from "node:assert/strict";
import { CombatBuilder } from "../src/game/simulation/combatBuilder.js";
import { humanFighter } from "../src/content/characters/humanFighter.js";
import { humanWizard } from "../src/content/characters/humanWizard.js";
import { goblin } from "../src/content/creatures/goblin.js";
import { caveRat } from "../src/content/creatures/caveRat.js";

test("builder rejects combats without opposing factions", () => {
  const builder = new CombatBuilder().add(humanFighter).add(humanWizard);
  const validation = builder.validate();
  assert.equal(validation.ok, false);
  assert.deepEqual(validation.errors, ["AT_LEAST_TWO_FACTIONS_REQUIRED"]);
});

test("multi-participant combat tracks rounds and rejects invalid turns", () => {
  const { session } = new CombatBuilder({ seed: 12 })
    .add(humanFighter, { faction: "heroes" })
    .add(humanWizard, { faction: "heroes" })
    .add(goblin, { faction: "monsters" })
    .add(caveRat, { faction: "monsters" })
    .build();

  session.start();
  assert.equal(session.snapshot().participants.length, 4);
  const wrongActor = session.turnOrder.find((id) => id !== session.activeEntityId);
  assert.deepEqual(session.submitIntent({ type: "PASS", actorId: wrongActor }), { ok: false, reason: "NOT_ACTOR_TURN" });

  const initialRound = session.round;
  for (let i = 0; i < session.turnOrder.length; i += 1) {
    assert.equal(session.submitIntent({ type: "PASS", actorId: session.activeEntityId }).ok, true);
  }
  assert.equal(session.round, initialRound + 1);
  assert.equal(session.snapshot().history.length, 5);
});

test("dodge applies disadvantage until the defender next turn", () => {
  const { session } = new CombatBuilder({ seed: 4 })
    .add(humanFighter, { faction: "heroes" })
    .add(goblin, { faction: "monsters" })
    .build();
  session.start();

  const dodgerId = session.activeEntityId;
  assert.equal(session.submitIntent({ type: "DODGE", actorId: dodgerId }).ok, true);
  const attackerId = session.activeEntityId;
  assert.equal(session.submitIntent({ type: "ATTACK", actorId: attackerId, targetId: dodgerId }).ok, true);
  const attackRoll = session.events.all().findLast((event) => event.type === "DICE_ROLLED" && event.purpose === "ATTACK");
  assert.equal(attackRoll.rolls.length, 2);
  assert.equal(session.snapshot().participants.find((p) => p.entityId === dodgerId).conditions.includes("DODGING"), false);
});

test("friendly targets are rejected without advancing the turn", () => {
  const { session } = new CombatBuilder({ seed: 5 })
    .add(humanFighter, { faction: "heroes" })
    .add(humanWizard, { faction: "heroes" })
    .add(goblin, { faction: "monsters" })
    .build();
  session.start();
  const actorId = session.activeEntityId;
  const actor = session.snapshot().participants.find((p) => p.entityId === actorId);
  const ally = session.snapshot().participants.find((p) => p.faction === actor.faction && p.entityId !== actorId);
  if (!ally) return;
  assert.equal(session.submitIntent({ type: "ATTACK", actorId, targetId: ally.entityId }).reason, "INVALID_TARGET");
  assert.equal(session.activeEntityId, actorId);
});

test("equipment determines fighter armor class", () => {
  const { session } = new CombatBuilder().add(humanFighter).add(goblin).build();
  session.start();
  const fighter = session.snapshot().participants.find((p) => p.identity.definitionId === "human-fighter");
  assert.equal(fighter.armorClass, 18);
});
