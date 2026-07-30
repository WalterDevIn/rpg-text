import test from "node:test";
import assert from "node:assert/strict";
import { createInMemoryCombatSessionRepository } from "../src/infrastructure/persistence/inMemoryCombatSessionRepository.js";
import { characterCatalog } from "../src/content/catalog/characterCatalog.js";
import { creatureCatalog } from "../src/content/catalog/creatureCatalog.js";
import { scenarioCatalog } from "../src/content/catalog/scenarioCatalog.js";

test("in-memory combat repository saves, finds, and removes sessions", () => {
  const repository = createInMemoryCombatSessionRepository();
  const id = repository.allocateId();
  const session = { status: "ACTIVE" };
  assert.equal(repository.findById(id), undefined);
  repository.save(id, session);
  assert.equal(repository.has(id), true);
  assert.equal(repository.findById(id), session);
  assert.equal(repository.remove(id), true);
  assert.equal(repository.findById(id), undefined);
});

test("content catalogs resolve canonical definitions by category", () => {
  assert.equal(characterCatalog.findById("human-fighter").kind, "character");
  assert.equal(creatureCatalog.findById("goblin").kind, "creature");
  assert.equal(scenarioCatalog.findById("open-field").name, "Open Field");
  assert.equal(creatureCatalog.findById("missing"), undefined);
});
