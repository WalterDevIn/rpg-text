import test from "node:test";
import assert from "node:assert/strict";
import { createMobileApi, normalizeMobileApiBaseUrl } from "../src/services/mobileApi.js";
import { eventMessage, mergeCombatEvents } from "../src/utilities/combatEvents.js";

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
