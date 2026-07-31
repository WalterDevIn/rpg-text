import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createMobileApi, normalizeMobileApiBaseUrl } from "../src/services/mobileApi.js";
import { eventMessage, mergeCombatEvents } from "../src/utilities/combatEvents.js";
import { createLocalCommandMessage, groupCombatMessages, toCombatMessages } from "../src/utilities/combatPresentation.js";

test("mobile API base URLs normalize without requiring /api", () => {
  assert.equal(normalizeMobileApiBaseUrl("http://10.0.2.2:3000"), "http://10.0.2.2:3000/api");
  assert.equal(normalizeMobileApiBaseUrl("https://example.test/api/"), "https://example.test/api");
});

test("mobile API rejects invalid URLs and returns encounter validation details", async () => {
  assert.throws(() => normalizeMobileApiBaseUrl("not a URL"), { code: "INVALID_SERVER_URL" });
  const api = createMobileApi("http://localhost:3000", {
    fetchImpl: async () => new Response(JSON.stringify({ error: { code: "INVALID_ENCOUNTER", message: "Choose opposing sides.", details: [{ field: "assignments", message: "Opposing sides are required." }] } }), { status: 422, headers: { "Content-Type": "application/json" } }),
  });
  assert.deepEqual(await api.validateEncounterSetup({}), { ok: false, errors: [{ field: "assignments", message: "Opposing sides are required." }] });
});

test("mobile event merge sorts and deduplicates by sequence", () => {
  const result = mergeCombatEvents([{ sequence: 2, type: "B" }, { sequence: 1, type: "A" }], [{ sequence: 2, type: "B2" }, { sequence: 3, type: "C" }]);
  assert.deepEqual(result.map(({ sequence, type }) => [sequence, type]), [[1, "A"], [2, "B"], [3, "C"]]);
});

test("mobile event messages render server semantic segments and preserve origin", () => {
  const event = { sequence: 1, origin: "dice", segments: [{ text: "Goblin · ATTACK: 1d20 = 14" }] };
  assert.equal(eventMessage(event), "Goblin · ATTACK: 1d20 = 14");
  assert.equal(event.origin, "dice");
});

test("combat messages group consecutive senders and restart after an interruption", () => {
  const messages = groupCombatMessages([
    { senderKind: "dm", senderId: "dm", senderName: "Dungeon Master" },
    { senderKind: "dm", senderId: "dm", senderName: "Dungeon Master" },
    { senderKind: "dice", senderId: "dice", senderName: "Dice" },
    { senderKind: "dm", senderId: "dm", senderName: "Dungeon Master" },
    { senderKind: "actor:creature", senderId: "goblin", senderName: "Goblin" },
    { senderKind: "actor:creature", senderId: "rat", senderName: "Cave Rat" },
    { senderKind: "dm", senderId: "dm", senderName: "Dungeon Master" },
  ]);
  assert.deepEqual(messages.map((message) => message.showSenderLabel), [true, false, true, true, true, true, true]);
});

test("actor attribution uses authoritative participant and local control", () => {
  const snapshot = { participants: [
    { entityId: "walter", identity: { name: "Walter", kind: "character" }, controller: "manual", faction: "heroes" },
    { entityId: "goblin", identity: { name: "Goblin", kind: "creature" }, controller: "ai", faction: "monsters" },
  ] };
  const messages = toCombatMessages([
    { sequence: 1, origin: "player", segments: [{ text: "Ataco", semantic: { referenceId: "entity:walter" } }] },
    { sequence: 2, origin: "creature", references: { "entity:goblin": {} }, text: "Ataco a Walter." },
  ], snapshot);
  assert.deepEqual(messages.map(({ senderName, alignment, controlledLocally }) => ({ senderName, alignment, controlledLocally })), [
    { senderName: "Walter", alignment: "right", controlledLocally: true },
    { senderName: "Goblin", alignment: "left", controlledLocally: false },
  ]);
  assert.equal(messages[0].senderName.includes("YOU"), false);
  assert.equal(messages[0].senderName.includes("TU"), false);
});

test("local command attribution captures the submitting actor before turn advancement", () => {
  const actor = { entityId: "walter", identity: { name: "Walter", kind: "character" } };
  const message = createLocalCommandMessage({ actor, sequence: "2.1", text: "Ataco al goblin." });
  assert.deepEqual(message, {
    sequence: "2.1",
    local: true,
    origin: "player",
    senderId: "walter",
    senderName: "Walter",
    senderKind: "actor:character",
    controlledLocally: true,
    text: "Ataco al goblin.",
  });
});

test("combat layout uses the compact composer and removes the permanent header metadata", () => {
  const source = readFileSync(new URL("../src/screens/CombatScreen.js", import.meta.url), "utf8");
  assert.match(source, /accessibilityLabel="Send command"/);
  assert.match(source, /styles\.sendButton/);
  assert.doesNotMatch(source, /title=\{pending \? "Sending\.\.\."/);
  assert.doesNotMatch(source, /styles\.eyebrow/);
  assert.doesNotMatch(source, /styles\.status\}>ROUND/);
});
