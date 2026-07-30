import test from "node:test";
import assert from "node:assert/strict";
import { createApiServer } from "../src/http/app.js";

test("interpret and command REST endpoints preserve preview/execution separation", async () => {
  const server = createApiServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const created = await post(base, "/api/combat-sessions", { seed: 19, characterIds: ["human-fighter"], creatureIds: ["goblin"], assignments: { "human-fighter": "party", goblin: "hostiles" }, scenarioId: "open-field" });
    const id = created.body.sessionId;
    const preview = await post(base, `/api/combat-sessions/${id}/interpret`, { text: "Ataco al goblin" });
    assert.equal(preview.status, 200);
    assert.equal(preview.body.status, "RESOLVED");
    assert.equal(preview.body.originalText, "Ataco al goblin");
    const incomplete = await post(base, `/api/combat-sessions/${id}/commands`, { text: "Ataco" });
    assert.equal(incomplete.status, 422);
    assert.equal(incomplete.body.interpretation.status, "INCOMPLETE");
    const unsupported = await post(base, `/api/combat-sessions/${id}/commands`, { text: "Lanzo bola de fuego" });
    assert.equal(unsupported.status, 422);
    assert.equal(unsupported.body.interpretation.status, "UNSUPPORTED");
    const executed = await post(base, `/api/combat-sessions/${id}/commands`, { text: "Ataco al goblin" });
    assert.equal(executed.status, 200);
    assert.equal(executed.body.interpretation.intent.type, "ATTACK");
    assert.ok(executed.body.events.length > 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

async function post(base, path, body) {
  const response = await fetch(`${base}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}
