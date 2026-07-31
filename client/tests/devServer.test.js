import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { stat } from "node:fs/promises";
import { createClientServer } from "../src/app/devServer.js";
import { createAudioPool } from "../src/audio/audioPool.js";
import { soundCatalog } from "../src/audio/soundCatalog.js";

test("client server serves public root assets, source modules, shared modules, and proxies API", async () => {
  const backend = http.createServer((request, response) => response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ path: request.url })));
  await listen(backend);
  const client = createClientServer({ apiTarget: `http://127.0.0.1:${backend.address().port}` });
  await listen(client);
  const base = `http://127.0.0.1:${client.address().port}`;
  try {
    const root = await fetch(`${base}/`);
    assert.equal(root.status, 200);
    assert.match(await root.text(), /RPG Text \/ Encounter Setup/);

    for (const asset of ["key-press.mp3", "dice.mp3", "dices.mp3"]) {
      const response = await fetch(`${base}/sounds/${asset}`);
      assert.equal(response.status, 200, asset);
      assert.equal(response.headers.get("content-type"), "audio/mpeg", asset);
      const local = await stat(new URL(`../public/sounds/${asset}`, import.meta.url));
      assert.equal(Number(response.headers.get("content-length") ?? (await response.arrayBuffer()).byteLength), local.size);
    }

    const source = await fetch(`${base}/src/app/index.js`);
    assert.equal(source.status, 200);
    assert.match(await source.text(), /createAppShell/);
    const shared = await fetch(`${base}/shared/src/index.js`);
    assert.equal(shared.status, 200);
    assert.match(await shared.text(), /contracts/);
    const api = await fetch(`${base}/api/health?test=1`);
    assert.equal(api.status, 200);
    assert.deepEqual(await api.json(), { path: "/api/health?test=1" });
  } finally {
    await close(client);
    await close(backend);
  }
});

test("client server returns 404 for missing public assets and 403 for traversal", async () => {
  const server = createClientServer();
  await listen(server);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(`${base}/sounds/missing.mp3`)).status, 404);
    assert.equal((await rawStatus(server, "/sounds/%2e%2e/src/app/index.js")).status, 403);
    assert.equal((await rawStatus(server, "/shared/%2e%2e/client/src/app/index.js")).status, 403);
    assert.equal((await rawStatus(server, "/src/%2e%2e/client/public/sounds/dice.mp3")).status, 403);
  } finally {
    await close(server);
  }
});

test("sound catalog stays rooted at sounds", () => {
  assert.deepEqual(soundCatalog, { TYPEWRITER_KEY: "/sounds/key-press.mp3", SINGLE_DIE: "/sounds/dice.mp3", MULTIPLE_DICE: "/sounds/dices.mp3" });
});

test("autoplay rejection is ignored while other playback errors are warned without rejection", async () => {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (message) => warnings.push(message);
  class RejectingAudio {
    constructor(src) { this.src = src; }
    pause() {}
    play() { return Promise.reject(this.src.endsWith("autoplay.mp3") ? Object.assign(new Error("gesture required"), { name: "NotAllowedError" }) : new Error("decode failed")); }
  }
  try {
    createAudioPool({ src: "/sounds/autoplay.mp3", size: 1, volume: .18, rateRange: [.9, 1.1], AudioCtor: RejectingAudio }).play();
    createAudioPool({ src: "/sounds/broken.mp3", size: 1, volume: .18, rateRange: [.9, 1.1], AudioCtor: RejectingAudio }).play();
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /\/sounds\/broken\.mp3/);
  } finally {
    console.warn = originalWarn;
  }
});

async function listen(server) {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
}

async function close(server) {
  await new Promise((resolve) => server.close(resolve));
}

async function rawStatus(server, path) {
  return new Promise((resolve, reject) => {
    const request = http.request({ hostname: "127.0.0.1", port: server.address().port, path, method: "GET" }, (response) => {
      response.resume();
      response.on("end", () => resolve({ status: response.statusCode }));
    });
    request.on("error", reject);
    request.end();
  });
}
