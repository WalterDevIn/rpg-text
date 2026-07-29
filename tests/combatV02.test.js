import test from "node:test";
import assert from "node:assert/strict";
import { CombatBuilder } from "../src/game/simulation/combatBuilder.js";
import { humanFighter } from "../src/content/characters/humanFighter.js";
import { humanWizard } from "../src/content/characters/humanWizard.js";
import { goblin } from "../src/content/creatures/goblin.js";
import { caveRat } from "../src/content/creatures/caveRat.js";

test("builder rejects combats without opposing factions", () => {
  const builder = new CombatBuilder().add(humanFighter).add(humanWizard);
  assert.equal(builder.validate().ok, false);
});

test("multi-participant combat tracks rounds and skips invalid intents", () => {
  const { session } = new CombatBuilder({ seed: 12 })
    .add(humanFighter, { faction: "heroes" })
    .add(humanWizard, { faction: "heroes" })
    .add(goblin, { faction: "monsters" })
    .add(caveRat, { faction: "monsters" })
    .build();

  session.start();
  const wrongActor = session.turnOrder.find((id) => id !== session.activeEntityId);
  assert.deepEqual(session.submitIntent({ type: "PASS", actorId: wrongActor }), { ok: false, reason: "NOT_ACTOR_TURN" });

  const initialRound = session.round;
  for (let i = 0; i < session.turnOrder.length; i += 1) {
    session.submitIntent({ type: "PASS", actorId: session.activeEntityId });
  }
  assert.equal(session.round, initialRound + 1);
});

test("dodge applies disadvantage until the defender next turn", () => {
  const { session } = new CombatBuilder({ seed: 4 })
    .add(humanFighter, { faction: "heroes" })
    .add(goblin, { faction: "monsters" })
    .build();
  session.start();

  const dodgerId = session.activeEntityId;
  session.submitIntent({ type: "DODGE", actorId: dodgerId });
  const attackerId = session.activeEntityId;
  const result = session.submitIntent({ type: "ATTACK", actorId: attackerId, targetId: dodgerId });
  assert.equal(result.ok, true);
  const attackRoll = session.events.all().findLast((event) => event.type === "DICE_ROLLED" && event.payload.purpose === "ATTACK");
  assert.equal(attackRoll.payload.rolls.length, 2);
});

test("friendly targets are rejected and do not advance the turn", () => {
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
  assert.equal(session.submitIntent({ type: "ATTACK", actorId, targetId: ally.entityId }).ok, false);
  assert.equal(session.activeEntityId, actorId);
});