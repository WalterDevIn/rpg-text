import test from "node:test";
import assert from "node:assert/strict";
import { createApiServer } from "../src/http/server.js";

test("REST API serves content, validates encounters, and creates sessions", async () => {
  const server = createApiServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const health = await request(baseUrl, "/api/health");
    assert.equal(health.status, 200);
    assert.deepEqual(health.body, { status: "ok" });
    const cors = await fetch(`${baseUrl}/api/health`, { headers: { Origin: "https://shiny-winner-g4qwrwp65g593vg7w-4173.app.github.dev" } });
    assert.equal(cors.status, 200);
    assert.equal(cors.headers.get("access-control-allow-origin"), "https://shiny-winner-g4qwrwp65g593vg7w-4173.app.github.dev");
    const denied = await fetch(`${baseUrl}/api/health`, { headers: { Origin: "https://untrusted.example" } });
    assert.equal(denied.status, 403);

    const characters = await request(baseUrl, "/api/encounter/characters");
    const creatures = await request(baseUrl, "/api/encounter/creatures");
    const scenarios = await request(baseUrl, "/api/encounter/scenarios");
    assert.equal(characters.status, 200);
    assert.equal(characters.body.characters[0].id, "human-fighter");
    assert.equal(creatures.body.creatures[0].id, "goblin");
    assert.equal(scenarios.body.scenarios[0].id, "open-field");
    assert.equal("world" in characters.body.characters[0], false);

    const malformed = await fetch(`${baseUrl}/api/encounter/validate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).error.code, "MALFORMED_JSON");

    const duplicate = await post(baseUrl, "/api/encounter/validate", {
      characterIds: ["human-fighter", "human-fighter"],
      creatureIds: ["goblin"],
      assignments: { "human-fighter": "party", goblin: "hostiles" },
      scenarioId: "open-field",
    });
    assert.equal(duplicate.status, 422);
    assert.equal(duplicate.body.error.code, "INVALID_ENCOUNTER");
    assert.ok(duplicate.body.error.details.some(({ code }) => code === "DUPLICATE_PARTICIPANT"));

    const unknown = await post(baseUrl, "/api/encounter/validate", {
      characterIds: ["missing-character"],
      creatureIds: ["goblin"],
      assignments: { "missing-character": "party", goblin: "hostiles" },
      scenarioId: "missing-scenario",
    });
    assert.equal(unknown.status, 422);
    assert.ok(unknown.body.error.details.some(({ code }) => code === "UNKNOWN_PARTICIPANT"));
    assert.ok(unknown.body.error.details.some(({ code }) => code === "SCENARIO_REQUIRED"));

    const validInput = {
      seed: 2026,
      characterIds: ["human-fighter"],
      creatureIds: ["goblin", "cave-rat"],
      assignments: { "human-fighter": "party", goblin: "hostiles", "cave-rat": "hostiles" },
      scenarioId: "open-field",
    };
    const created = await post(baseUrl, "/api/combat-sessions", validInput);
    assert.equal(created.status, 201);
    assert.match(created.body.sessionId, /^combat-/);
    assert.equal(created.body.scenario.id, "open-field");
    assert.equal(created.body.snapshot.status, "ACTIVE");
    assert.ok(created.body.events.length > 0);

    const session = await request(baseUrl, `/api/combat-sessions/${created.body.sessionId}`);
    assert.equal(session.status, 200);
    assert.equal(session.body.snapshot.activeEntityId, created.body.snapshot.activeEntityId);
    const events = await request(baseUrl, `/api/combat-sessions/${created.body.sessionId}/events?since=0`);
    assert.equal(events.status, 200);
    assert.ok(events.body.events.length > 0);

    const intent = await post(baseUrl, `/api/combat-sessions/${created.body.sessionId}/intents`, { type: "PASS", actorId: created.body.snapshot.activeEntityId });
    assert.equal(intent.status, 200);
    assert.equal(intent.body.ok, true);
    assert.notEqual(intent.body.snapshot.activeEntityId, created.body.snapshot.activeEntityId);
    assert.equal((await request(baseUrl, "/api/combat-sessions/missing")).status, 404);

    const playable = await post(baseUrl, "/api/combat-sessions", {
      seed: 77,
      characterIds: ["human-fighter"],
      creatureIds: ["goblin"],
      assignments: { "human-fighter": "party", goblin: "hostiles" },
      scenarioId: "open-field",
    });
    let playableSnapshot = playable.body.snapshot;
    for (let turn = 0; turn < 50 && playableSnapshot.status === "ACTIVE"; turn += 1) {
      const actor = playableSnapshot.participants.find((participant) => participant.entityId === playableSnapshot.activeEntityId);
      assert.equal(actor.controller, "manual");
      const target = playableSnapshot.participants.find((participant) => !participant.defeated && participant.faction !== actor.faction);
      const action = await post(baseUrl, `/api/combat-sessions/${playable.body.sessionId}/intents`, { type: "ATTACK", actorId: actor.entityId, targetId: target.entityId });
      assert.equal(action.status, 200);
      playableSnapshot = action.body.snapshot;
    }
    assert.equal(playableSnapshot.status, "FINISHED");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

async function request(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`);
  return { status: response.status, body: await response.json() };
}

async function post(baseUrl, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}
