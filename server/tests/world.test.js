import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../src/game/ecs/world.js";

test("world creates entities and stores isolated component data", () => {
  const world = new World();
  const entity = world.createEntity("character");
  const source = { current: 10, max: 10 };
  world.addComponent(entity, "Health", source);
  source.current = 0;

  assert.equal(world.requireComponent(entity, "Health").current, 10);
  assert.deepEqual(world.query("Health"), [entity]);
});

test("removing an entity removes it from component queries", () => {
  const world = new World();
  const entity = world.createEntity();
  world.addComponent(entity, "Health", { current: 1 });

  assert.equal(world.removeEntity(entity), true);
  assert.deepEqual(world.query("Health"), []);
});
