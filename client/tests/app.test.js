import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createAppShell } from "../src/app/index.js";
import { combatService, HttpApplicationError } from "../src/services/combatService.js";
import { clearStoredApiBaseUrl, normalizeApiBaseUrl, setStoredApiBaseUrl } from "../src/services/apiConfig.js";
import { createEncounterState, encounterInput, reduceEncounterState, TabId } from "../src/app/state/encounterState.js";

test("client shell uses an injected service boundary", () => {
  const service = { createCombatSession() {} };
  assert.equal(createAppShell(service).service, service);
});

test("API base URL normalization and local persistence work", () => {
  assert.equal(normalizeApiBaseUrl("https://example.app.github.dev"), "https://example.app.github.dev/api");
  assert.equal(normalizeApiBaseUrl("https://example.app.github.dev/"), "https://example.app.github.dev/api");
  assert.equal(normalizeApiBaseUrl("https://example.app.github.dev/api"), "https://example.app.github.dev/api");
  assert.equal(normalizeApiBaseUrl("https://example.app.github.dev/api/"), "https://example.app.github.dev/api");
  assert.equal(normalizeApiBaseUrl("/api/"), "/api");
  const originalStorage = globalThis.localStorage;
  const values = new Map();
  globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  try {
    assert.equal(setStoredApiBaseUrl("https://example.app.github.dev"), "https://example.app.github.dev/api");
    assert.equal(clearStoredApiBaseUrl(), "/api");
  } finally {
    globalThis.localStorage = originalStorage;
  }
});

test("client HTTP service parses successful content responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const payload = url.endsWith("characters") ? { characters: [{ id: "human-fighter" }] }
      : url.endsWith("creatures") ? { creatures: [{ id: "goblin" }] }
        : { scenarios: [{ id: "open-field" }] };
    return { ok: true, status: 200, json: async () => payload };
  };
  try {
    assert.equal((await combatService.listEncounterCharacters()).characters[0].id, "human-fighter");
    assert.equal((await combatService.listEncounterCreatures()).creatures[0].id, "goblin");
    assert.equal((await combatService.listEncounterScenarios()).scenarios[0].id, "open-field");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("tabs and selections persist in explicit client state", () => {
  let state = createEncounterState();
  state = reduceEncounterState(state, { type: "TOGGLE_CHARACTER", id: "human-fighter" });
  state = reduceEncounterState(state, { type: "SET_TAB", tab: TabId.CREATURES });
  state = reduceEncounterState(state, { type: "TOGGLE_CREATURE", id: "goblin" });
  state = reduceEncounterState(state, { type: "SET_TAB", tab: TabId.SCENARIO });
  state = reduceEncounterState(state, { type: "SELECT_SCENARIO", id: "open-field" });
  assert.equal(state.activeTab, TabId.SCENARIO);
  assert.deepEqual(encounterInput(state), {
    characterIds: ["human-fighter"],
    creatureIds: ["goblin"],
    assignments: { "human-fighter": "party", goblin: "hostiles" },
    scenarioId: "open-field",
  });
});

test("client state uses one side assignment per participant", () => {
  let state = createEncounterState();
  state = reduceEncounterState(state, { type: "TOGGLE_CHARACTER", id: "human-fighter" });
  state = reduceEncounterState(state, { type: "ASSIGN_SIDE", id: "human-fighter", side: "hostiles" });
  assert.equal(state.assignments["human-fighter"], "hostiles");
  state = reduceEncounterState(state, { type: "TOGGLE_CHARACTER", id: "human-fighter" });
  assert.equal(state.assignments["human-fighter"], undefined);
});

test("HTTP service converts server errors into application errors", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 422,
    json: async () => ({ error: { code: "INVALID_ENCOUNTER", message: "Invalid setup.", details: [{ code: "DUPLICATE_PARTICIPANT", message: "Duplicate." }] } }),
  });
  try {
    const invalid = await combatService.validateEncounterSetup({ characterIds: [], creatureIds: [], assignments: {}, scenarioId: null });
    assert.equal(invalid.ok, false);
    assert.equal(invalid.errors[0].code, "DUPLICATE_PARTICIPANT");
    await assert.rejects(() => combatService.createCombatSession({}), (error) => error instanceof HttpApplicationError && error.code === "INVALID_ENCOUNTER");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("HTTP service reports an unavailable server", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("connection refused"); };
  try {
    await assert.rejects(() => combatService.listEncounterCharacters(), (error) => error.code === "NETWORK_ERROR" && error.message.includes("unavailable"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("valid setup sends the selected encounter through HTTP", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, status: 201, json: async () => ({ ok: true, sessionId: "combat-1", snapshot: { status: "ACTIVE" }, events: [] }) };
  };
  try {
    const invalid = await combatService.validateEncounterSetup({ characterIds: [], creatureIds: [], assignments: {}, scenarioId: null });
    assert.equal(invalid.ok, true);
    const result = await combatService.createCombatSession({
      characterIds: ["human-fighter"],
      creatureIds: ["goblin"],
      assignments: { "human-fighter": "party", goblin: "hostiles" },
      scenarioId: "open-field",
    });
    assert.equal(result.sessionId, "combat-1");
    assert.equal(requests.at(-1).url.endsWith("/combat-sessions"), true);
    assert.equal(JSON.parse(requests.at(-1).options.body).scenarioId, "open-field");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("HTTP service sends all supported intent types", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, status: 200, json: async () => ({ ok: true, snapshot: { status: "ACTIVE" }, events: [] }) };
  };
  try {
    await combatService.submitCombatIntent("combat-1", { type: "ATTACK", actorId: "a", targetId: "b" });
    await combatService.submitCombatIntent("combat-1", { type: "DODGE", actorId: "a" });
    await combatService.submitCombatIntent("combat-1", { type: "PASS", actorId: "a" });
    assert.deepEqual(requests.map(({ url }) => url.split("/").at(-1)), ["intents", "intents", "intents"]);
    assert.deepEqual(requests.map(({ options }) => JSON.parse(options.body).type), ["ATTACK", "DODGE", "PASS"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("invalid setup remains invalid before the Start button can be enabled", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: false, errors: [{ code: "CHARACTER_REQUIRED", message: "Select a character." }] }) });
  try {
    const invalid = await combatService.validateEncounterSetup({ characterIds: [], creatureIds: [], assignments: {}, scenarioId: null });
    assert.equal(invalid.ok, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("client source does not import internal simulation modules", async () => {
  const source = await readFile(new URL("../src/services/combatService.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /server\/src\/game|\/ecs\/|\/systems\/|\/rules\//);
});
