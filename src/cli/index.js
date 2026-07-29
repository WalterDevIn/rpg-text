import { CombatSession } from "../game/simulation/combatSession.js";
import { Component } from "../game/components/types.js";
import { humanFighter } from "../content/characters/humanFighter.js";
import { goblin } from "../content/creatures/goblin.js";
import { presentEvent } from "./eventPresenter.js";

const session = new CombatSession({ seed: 2026 });
const heroId = session.addParticipant(humanFighter);
const goblinId = session.addParticipant(goblin);
const names = new Map([
  [heroId, "Walter"],
  [goblinId, "Goblin"],
]);
let lastSequence = 0;

console.log("RPG Text · Combat Core v0.1");
session.start();
flushEvents();

while (session.status === "ACTIVE") {
  const actorId = session.activeEntityId;
  const actorController = session.world.requireComponent(actorId, Component.CONTROLLER).type;
  const targetId = actorId === heroId ? goblinId : heroId;

  if (actorController === "player") console.log("Command: attack goblin");
  else console.log("AI command: attack Walter");

  session.submitIntent({ type: "ATTACK", actorId, targetId });
  flushEvents();
}

console.log("\nFinal state:");
for (const participant of session.snapshot().participants) {
  const defeated = participant.defeated ? " · defeated" : "";
  console.log(`- ${participant.identity.name}: ${participant.health.current}/${participant.health.max} HP${defeated}`);
}

function flushEvents() {
  for (const event of session.events.since(lastSequence)) {
    const line = presentEvent(event, names);
    if (line) console.log(line);
    lastSequence = event.sequence;
  }
}
