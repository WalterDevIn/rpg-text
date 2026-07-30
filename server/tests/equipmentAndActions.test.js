import test from "node:test";
import assert from "node:assert/strict";
import { CombatBuilder } from "../src/game/simulation/combatBuilder.js";
import { humanFighter } from "../src/content/characters/humanFighter.js";
import { goblin } from "../src/content/creatures/goblin.js";
import { calculateArmorClass, getAttackProfile } from "../src/game/rules/equipmentRules.js";

test("equipment determines armor class and attack profile", () => {
  const { session, ids } = new CombatBuilder().add(humanFighter).add(goblin).build();
  const fighterId = ids[0];
  assert.equal(calculateArmorClass(session.world, fighterId), session.world.requireComponent(fighterId, "ArmorClass").value);
  const attack = getAttackProfile(session.world, fighterId);
  assert.equal(typeof attack.attackBonus, "number");
  assert.equal(typeof attack.damageBonus, "number");
});

test("combatants can attack while unarmed", () => {
  const { session, ids } = new CombatBuilder({ seed: 9 })
    .add(humanFighter, { weapon: null, initiativeBonus: 100 })
    .add(goblin, { initiativeBonus: -100 })
    .build();
  session.start();
  const result = session.submitIntent({ type: "ATTACK", actorId: ids[0], targetId: ids[1] });
  assert.equal(result.ok, true);
  const declared = session.events.all().find((event) => event.type === "INTENT_DECLARED");
  assert.equal(declared.payload.instrumentId, null);
});

test("dodge and pass advance turns without damage", () => {
  const { session } = new CombatBuilder({ seed: 3 }).add(humanFighter).add(goblin).build();
  session.start();
  const first = session.activeEntityId;
  assert.equal(session.submitIntent({ type: "DODGE", actorId: first }).ok, true);
  const second = session.activeEntityId;
  assert.notEqual(second, first);
  assert.equal(session.submitIntent({ type: "PASS", actorId: second }).ok, true);
});
