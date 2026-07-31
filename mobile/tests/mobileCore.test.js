import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createMobileApi, normalizeMobileApiBaseUrl } from "../src/services/mobileApi.js";
import { checkServerHealth, HEALTH_TIMEOUT_MS } from "../src/services/healthCheck.js";
import { predefinedServers } from "../src/services/serverOptions.js";
import { getAppVersion } from "../src/config/appMetadata.js";
import { eventMessage, mergeCombatEvents } from "../src/utilities/combatEvents.js";
import { createLocalCommandMessage, groupCombatMessages, semanticStyleKey, toCombatMessages } from "../src/utilities/combatPresentation.js";
import { createAudioPool } from "../src/audio/audioPool.js";
import { createMobilePresentationPreferences } from "../src/audio/audioPreferences.js";
import { createMobilePresentationQueue } from "../src/audio/messagePresentationQueue.js";
import { diceInfo, isDiceMessage, isMultipleDice, presentationPolicy, visibleSemanticSegments } from "../../shared/src/clientPresentation.js";
import { createEncounterDraft, participantLabel } from "../src/state/encounterDraft.js";

test("mobile API base URLs normalize without requiring /api", () => {
  assert.equal(normalizeMobileApiBaseUrl("http://10.0.2.2:3000"), "http://10.0.2.2:3000");
  assert.equal(normalizeMobileApiBaseUrl("https://example.test/api/"), "https://example.test");
  assert.equal(normalizeMobileApiBaseUrl("https://example.test/api/health"), "https://example.test");
});

test("predefined Codespaces server is origin-only and health uses exactly one API prefix", async () => {
  assert.equal(predefinedServers[0].label, "Codespaces Development");
  assert.equal(predefinedServers[0].address, "https://shiny-winner-g4qwrwp65g593vg7w-3000.app.github.dev");
  const calls = [];
  const api = createMobileApi(predefinedServers[0].address, { fetchImpl: async (url) => { calls.push(url); return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { "Content-Type": "application/json" } }); } });
  await api.getHealth();
  assert.deepEqual(calls, ["https://shiny-winner-g4qwrwp65g593vg7w-3000.app.github.dev/api/health"]);
  assert.doesNotMatch(calls[0], /\/api\/api/);
});

test("health diagnostics classify invalid, unreachable, timeout, status, HTML, JSON, and contract failures", async () => {
  const response = (body, status = 200, contentType = "application/json") => new Response(body, { status, headers: { "Content-Type": contentType } });
  assert.equal((await checkServerHealth("bad address")).diagnostic.title, "Invalid server address");
  assert.equal((await checkServerHealth("https://example.test", { fetchImpl: async () => { throw new TypeError("offline"); } })).diagnostic.title, "Server unreachable");
  assert.equal((await checkServerHealth("https://example.test", { fetchImpl: async (_url, { signal }) => await new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })))), timeoutMs: 8 })).diagnostic.title, "Connection timed out");
  assert.equal((await checkServerHealth("https://example.test", { fetchImpl: async () => response("", 401) })).diagnostic.title, "Server authorization required");
  assert.equal((await checkServerHealth("https://example.test", { fetchImpl: async () => response("", 403) })).diagnostic.title, "Server authorization required");
  const notFound = await checkServerHealth("https://example.test", { fetchImpl: async () => response("{}", 404) });
  assert.equal(notFound.diagnostic.title, "Health endpoint not found"); assert.match(notFound.diagnostic.message, /https:\/\/example\.test\/api\/health/);
  const html = await checkServerHealth("https://example.test", { fetchImpl: async () => response("<html>Hello<script>secret</script></html>", 200, "text/html") });
  assert.equal(html.diagnostic.title, "Unexpected web page received"); assert.equal(html.diagnostic.preview, "Hello"); assert.doesNotMatch(html.diagnostic.preview, /secret/);
  assert.equal((await checkServerHealth("https://example.test", { fetchImpl: async () => response("not-json") })).diagnostic.title, "Invalid server response");
  assert.equal((await checkServerHealth("https://example.test", { fetchImpl: async () => response(JSON.stringify({ status: "other" })) })).diagnostic.title, "Incompatible server");
  assert.equal((await checkServerHealth("https://example.test", { fetchImpl: async () => response("{}", 500) })).diagnostic.title, "Server error");
  assert.equal(HEALTH_TIMEOUT_MS, 10000);
});

test("aborted health checks return without a failure diagnostic", async () => {
  const controller = new AbortController(); controller.abort();
  const result = await checkServerHealth("https://example.test", { signal: controller.signal, fetchImpl: async () => { throw new Error("must not call"); } });
  assert.equal(result.aborted, true);
});

test("app version reads Expo metadata and safely falls back", () => {
  assert.equal(getAppVersion({ expoConfig: { version: "0.1.0" } }), "0.1.0");
  assert.equal(getAppVersion({ expoConfig: {} }), "unknown");
});

test("mobile navigation exposes the recoverable home and staged setup routes", () => {
  const source = readFileSync(new URL("../src/navigation/navigation.js", import.meta.url), "utf8");
  for (const route of ["HOME", "PARTICIPANTS", "ADD_PARTICIPANTS", "SCENARIO", "RULES", "REVIEW", "CREATION", "SETTINGS"]) assert.match(source, new RegExp(`${route}:`));
});

test("creation hub actions are disabled rather than pretending to create content", () => {
  const source = readFileSync(new URL("../src/screens/CreationHubScreen.js", import.meta.url), "utf8");
  assert.match(source, /disabled/);
  assert.doesNotMatch(source, /createCharacter|createCreature|fetch\(/);
});

test("encounter drafts preserve side, controller, scenario, step, and duplicate instance identity", () => {
  const draft = createEncounterDraft({ participants: [
    { instanceKey: "rat-1", sourceId: "cave-rat", displayName: "Cave Rat", participantKind: "creature", side: "hostiles", controller: "ai" },
    { instanceKey: "rat-2", sourceId: "cave-rat", displayName: "Cave Rat", participantKind: "creature", side: "party", controller: "manual" },
  ], scenarioId: "open-field", ruleConfiguration: { seed: 7 }, currentStep: 3 });
  assert.equal(draft.participants[1].controller, "manual");
  assert.equal(participantLabel(draft.participants[0], draft.participants), "Cave Rat 1");
  assert.equal(participantLabel(draft.participants[1], draft.participants), "Cave Rat 2");
  assert.equal(draft.scenarioId, "open-field");
  assert.equal(draft.currentStep, 3);
});

test("mobile app registers the complete explicit stack and settings exposes persisted volume", () => {
  const app = readFileSync(new URL("../src/app/App.js", import.meta.url), "utf8");
  const navigation = readFileSync(new URL("../src/navigation/navigation.js", import.meta.url), "utf8");
  for (const route of ["Connection", "Home", "NewCombatParticipants", "AddParticipants", "NewCombatScenario", "NewCombatRules", "NewCombatReview", "Combat", "CreationHub", "Settings"]) assert.match(navigation, new RegExp(`\\"${route}\\"`));
  assert.match(app, /Stack\.Screen/);
  const settings = readFileSync(new URL("../src/screens/SettingsScreen.js", import.meta.url), "utf8");
  assert.match(settings, /masterVolume/);
  assert.match(settings, /clearLocalPreferences/);
  assert.match(readFileSync(new URL("../src/screens/ServerConnectionScreen.js", import.meta.url), "utf8"), /predefinedServers/);
  assert.match(settings, /App version/);
  assert.match(readFileSync(new URL("../src/config/appMetadata.js", import.meta.url), "utf8"), /expoConfig/);
});

test("mobile API rejects invalid URLs and returns encounter validation details", async () => {
  assert.throws(() => normalizeMobileApiBaseUrl("not a URL"), { code: "INVALID_SERVER_URL" });
  const api = createMobileApi("http://localhost:3000", {
    fetchImpl: async () => new Response(JSON.stringify({ error: { code: "INVALID_ENCOUNTER", message: "Choose opposing sides.", details: [{ field: "assignments", message: "Opposing sides are required." }] } }), { status: 422, headers: { "Content-Type": "application/json" } }),
  });
  assert.deepEqual(await api.validateEncounterSetup({}), { ok: false, errors: [{ field: "assignments", message: "Opposing sides are required." }] });
});

test("mobile API explains a successful non-JSON response", async () => {
  const api = createMobileApi("http://localhost:3000", {
    fetchImpl: async () => new Response("<html>Metro</html>", { status: 200 }),
  });
  const result = await api.getHealth();
  assert.equal(result.ok, false);
  assert.equal(result.diagnostic.title, "Unexpected web page received");
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
    segments: [{ text: "Ataco al goblin." }],
    references: {},
  });
});

test("combat layout uses the compact composer and removes the permanent header metadata", () => {
  const source = readFileSync(new URL("../src/screens/CombatScreen.js", import.meta.url), "utf8");
  assert.match(source, /returnKeyType="send"/);
  assert.match(source, /accessibilityHint=.*press Send on the keyboard/);
  assert.doesNotMatch(source, /sendButton|sendIcon|Send command/);
  assert.doesNotMatch(source, /styles\.eyebrow/);
  assert.doesNotMatch(source, /styles\.status\}>ROUND/);
});

test("mobile semantic styling supports all authoritative kinds and preserves damage precedence", () => {
  for (const kind of ["CHARACTER", "CREATURE", "ITEM", "SPELL", "ACTION", "DAMAGE", "DICE_ROLL"]) assert.equal(semanticStyleKey(kind), kind);
  assert.equal(semanticStyleKey("UNKNOWN"), "DEFAULT");
  const damage = { origin: "dice", references: { roll: { kind: "DAMAGE", notation: "2d6", rolls: [3, 4], total: 7 } } };
  assert.equal(diceInfo(damage).kind, "DAMAGE");
  assert.equal(isDiceMessage(damage), true);
  assert.equal(isMultipleDice(damage), true);
});

test("partial semantic typewriter text is styled but not complete for interaction", () => {
  const partial = visibleSemanticSegments([{ text: "Walter", semantic: { kind: "CHARACTER", referenceId: "entity:walter" } }], 3);
  const complete = visibleSemanticSegments([{ text: "Walter", semantic: { kind: "CHARACTER", referenceId: "entity:walter" } }], 6);
  assert.equal(partial[0].text, "Wal");
  assert.equal(partial[0].complete, false);
  assert.equal(complete[0].complete, true);
});

test("mobile queue preserves historical immediacy, live order, and skip", async () => {
  const timers = [];
  const scheduler = { setTimeout(callback, delay) { timers.push({ callback, delay }); return timers.length - 1; }, clearTimeout() {} };
  const changes = [];
  const preferences = { get: () => ({ soundEnabled: false, masterVolume: 1, textAnimationEnabled: true, reducedMotion: false }) };
  const queue = createMobilePresentationQueue({ scheduler, preferences, onChange: (records) => changes.push(records.map((record) => `${record.id}:${record.phase}`)) });
  queue.enqueue([{ id: "old", origin: "dm", segments: [{ text: "Old" }] }], { historical: true });
  assert.equal(queue.snapshot()[0].phase, "complete");
  queue.enqueue([{ id: "first", origin: "dm", segments: [{ text: "Uno" }] }, { id: "second", origin: "system", segments: [{ text: "Dos" }] }]);
  assert.equal(queue.isPresenting, true);
  timers.shift().callback(); await Promise.resolve();
  timers.shift().callback(); await Promise.resolve();
  assert.equal(queue.activeMessageId, "first");
  assert.equal(queue.skip(), true);
  await Promise.resolve();
  assert.equal(queue.snapshot().find((record) => record.id === "first").phase, "complete");
  assert.equal(presentationPolicy.characterDelay, 24);
  queue.dispose();
  assert.ok(changes.length > 0);
});

test("mobile audio pool uses bounded voices and master volume without creating per-playback objects", async () => {
  const players = [];
  const pool = createAudioPool({ source: "key", size: 2, volume: 0.18, rateRange: [0.9, 1.1], random: () => 0.5, playerFactory: () => { const player = { volume: 0, playbackRate: 1, playCalls: 0, pause() {}, play() { player.playCalls += 1; }, seekTo() { return Promise.resolve(); }, setPlaybackRate(rate) { player.playbackRate = rate; }, remove() {} }; players.push(player); return player; } });
  pool.play(0.5); pool.play(0.5); pool.play(0.5);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(players.length, 2);
  assert.equal(players[0].volume, 0.09);
  assert.equal(players[0].playbackRate, 1);
  assert.equal(players[0].playCalls, 2);
  pool.stop();
});

test("mobile presentation preferences persist sound, volume, animation, and reduced motion", async () => {
  const values = new Map();
  const storage = { getItem: async (key) => values.get(key) ?? null, setItem: async (key, value) => values.set(key, value) };
  const first = createMobilePresentationPreferences({ storage });
  await first.load();
  first.update({ soundEnabled: false, masterVolume: 0.4, textAnimationEnabled: false, reducedMotion: true });
  const restored = createMobilePresentationPreferences({ storage });
  await restored.load();
  assert.deepEqual(restored.get(), { soundEnabled: false, masterVolume: 0.4, textAnimationEnabled: false, reducedMotion: true });
});
