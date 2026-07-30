import test from "node:test";
import assert from "node:assert/strict";
import { parseCombatCommand } from "../src/language/spanish/parseCombatCommand.js";
import { tokenizeSpanishText } from "../src/language/spanish/tokenizeSpanishText.js";
import { createApplication } from "../src/application/createApplication.js";
import { presentCombatEvent } from "../src/application/presentation/presentCombatEvent.js";

function context({ targets = [{ entityId: "goblin-1", name: "Goblin", aliases: ["trasgo"], kind: "creature", faction: "monsters", health: { current: 7, max: 7 }, armorClass: 13, defeated: false }] } = {}) {
  return {
    status: "ACTIVE",
    activeActor: { entityId: "hero-1", controller: "manual" },
    availableActions: [{ type: "ATTACK", validTargetIds: targets.map(({ entityId }) => entityId) }, { type: "DODGE" }, { type: "PASS" }],
    participants: targets,
    availableItems: [{ id: "longsword", name: "Longsword", aliases: ["espada", "espada larga", "mi espada"], kind: "weapon", equipped: true, damageNotation: "1d8", damageType: "slashing" }],
    availableSpells: [],
  };
}

test("Spanish tokenizer preserves original offsets and normalized accents", () => {
  const tokens = tokenizeSpanishText("  Atacó  a la rata! ");
  assert.deepEqual(tokens.map(({ text, normalized, start, end }) => ({ text, normalized, start, end })), [
    { text: "Atacó", normalized: "ataco", start: 2, end: 7 },
    { text: "a", normalized: "a", start: 9, end: 10 },
    { text: "la", normalized: "la", start: 11, end: 13 },
    { text: "rata", normalized: "rata", start: 14, end: 18 },
  ]);
});

test("attack, dodge, and pass Spanish variants compile to existing intents", () => {
  const cases = [
    ["Ataco al goblin.", "ATTACK"],
    ["Golpeo al trasgo", "ATTACK"],
    ["Quiero atacar al goblin con mi espada larga", "ATTACK"],
    ["Esquivo", "DODGE"],
    ["Me defiendo", "DODGE"],
    ["No hago nada", "PASS"],
    ["Termino mi turno", "PASS"],
  ];
  for (const [text, type] of cases) assert.equal(parseCombatCommand(text, context()).intent.type, type, text);
  assert.equal(parseCombatCommand("Hablo con el goblin", context()).status, "UNSUPPORTED");
});

test("attack without target is incomplete and offers authoritative suggestions", () => {
  const result = parseCombatCommand("Ataco", context());
  assert.equal(result.status, "INCOMPLETE");
  assert.equal(result.intent, null);
  assert.equal(result.missing[0].suggestions[0].referenceId, "entity:goblin-1");
});

test("ambiguous target references are not silently selected", () => {
  const result = parseCombatCommand("Ataco al goblin", context({ targets: [
    { entityId: "goblin-1", name: "Goblin arquero", aliases: ["goblin"], kind: "creature", faction: "monsters", health: { current: 7, max: 7 }, armorClass: 13, defeated: false },
    { entityId: "goblin-2", name: "Goblin guerrero", aliases: ["goblin"], kind: "creature", faction: "monsters", health: { current: 7, max: 7 }, armorClass: 13, defeated: false },
  ] }));
  assert.equal(result.status, "AMBIGUOUS");
  assert.equal(result.intent, null);
  assert.equal(result.ambiguities[0].options.length, 2);
});

test("items and unsupported spells receive semantic annotations", () => {
  const attack = parseCombatCommand("Ataco al goblin con mi espada", context());
  assert.equal(attack.status, "RESOLVED");
  assert.equal(attack.annotations.find(({ kind }) => kind === "ITEM").referenceId, "item:longsword");
  const spell = parseCombatCommand("Lanzo bola de fuego", context());
  assert.equal(spell.status, "UNSUPPORTED");
  assert.ok(spell.annotations.some(({ kind }) => kind === "SPELL"));
});

test("application interpretation uses the live combat session and executes through intents", () => {
  const application = createApplication();
  const created = application.createCombatSession({ seed: 42, characterIds: ["human-fighter"], creatureIds: ["goblin"], assignments: { "human-fighter": "party", goblin: "hostiles" }, scenarioId: "open-field" });
  const interpretation = application.interpretCombatCommand(created.sessionId, "Ataco al goblin");
  assert.equal(interpretation.ok, true);
  assert.equal(interpretation.interpretation.status, "RESOLVED");
  assert.equal("world" in interpretation.interpretation, false);
  const execution = application.executeCombatCommand(created.sessionId, "Paso");
  assert.equal(execution.ok, true);
  assert.equal(execution.interpretation.intent.type, "PASS");
  assert.ok(execution.events.length > 0);
});

test("semantic event presentation gives damage priority over dice rolls", () => {
  const participants = [{ entityId: "hero-1", identity: { name: "Walter", kind: "character" }, health: { current: 10, max: 14 }, armorClass: 18, faction: "heroes", controller: "manual", conditions: [], defeated: false }];
  const dice = presentCombatEvent({ sequence: 1, type: "DICE_ROLLED", actorId: "hero-1", purpose: "INITIATIVE", notation: "1d20", naturalRoll: 12, modifier: 2, total: 14 }, participants);
  const damage = presentCombatEvent({ sequence: 2, type: "DICE_ROLLED", actorId: "hero-1", purpose: "DAMAGE", notation: "1d8", rolls: [6], modifier: 1, total: 7, damageType: "slashing", targetId: "hero-1" }, participants);
  assert.equal(dice.segments.find(({ semantic }) => semantic?.kind === "DICE_ROLL").semantic.kind, "DICE_ROLL");
  assert.equal(damage.segments.find(({ semantic }) => semantic?.kind === "CHARACTER").semantic.kind, "CHARACTER");
  assert.equal(damage.segments.find(({ semantic }) => semantic?.kind === "DAMAGE").semantic.kind, "DAMAGE");
  assert.equal(damage.segments.filter(({ semantic }) => semantic?.kind === "DICE_ROLL").length, 0);
});
