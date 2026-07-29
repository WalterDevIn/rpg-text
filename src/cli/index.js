import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { CombatBuilder } from "../game/simulation/combatBuilder.js";
import { humanFighter } from "../content/characters/humanFighter.js";
import { humanWizard } from "../content/characters/humanWizard.js";
import { goblin } from "../content/creatures/goblin.js";
import { caveRat } from "../content/creatures/caveRat.js";

const rl = readline.createInterface({ input, output });
const { session } = new CombatBuilder({ seed: 2026 })
  .add(humanFighter, { name: "Walter", faction: "heroes", controller: "manual" })
  .add(humanWizard, { name: "Mira", faction: "heroes", controller: "manual" })
  .add(goblin, { name: "Goblin A", faction: "monsters", controller: "manual" })
  .add(caveRat, { name: "Cave Rat", faction: "monsters", controller: "manual" })
  .build();

session.start();
console.log("RPG Text · Combat Core v0.2");
console.log("Commands: status, inspect <entity-id>, attack <entity-id>, dodge, pass, events, help, quit");
showStatus();

while (session.status === "ACTIVE") {
  const active = session.snapshot().participants.find((p) => p.entityId === session.activeEntityId);
  const raw = (await rl.question(`\nRound ${session.round} · ${active.identity.name}> `)).trim();
  if (!raw) continue;
  const [command, argument] = raw.split(/\s+/, 2);

  if (command === "quit") break;
  if (command === "help") {
    console.log("status | inspect <entity-id> | attack <entity-id> | dodge | pass | events | quit");
    continue;
  }
  if (command === "status") { showStatus(); continue; }
  if (command === "events") { showEvents(); continue; }
  if (command === "inspect") { inspect(argument); continue; }

  const intent = toIntent(command, argument);
  if (!intent) { console.log("Unknown command. Type help."); continue; }
  const before = session.events.all().at(-1)?.sequence ?? 0;
  const result = session.submitIntent(intent);
  if (!result.ok) console.log(`Rejected: ${result.reason}`);
  showEventsSince(before);
}

showStatus();
rl.close();

function toIntent(command, targetId) {
  if (command === "attack") return { type: "ATTACK", actorId: session.activeEntityId, targetId };
  if (command === "dodge") return { type: "DODGE", actorId: session.activeEntityId };
  if (command === "pass") return { type: "PASS", actorId: session.activeEntityId };
  return null;
}

function showStatus() {
  const snapshot = session.snapshot();
  console.log(`\nStatus: ${snapshot.status} · Round ${snapshot.round}`);
  for (const p of snapshot.participants) {
    console.log(`${p.entityId} | ${p.identity.name} | ${p.faction} | HP ${p.health.current}/${p.health.max} | AC ${p.armorClass}${p.conditions.length ? ` | ${p.conditions.join(", ")}` : ""}${p.defeated ? " | DEFEATED" : ""}`);
  }
}

function inspect(entityId) {
  const participant = session.snapshot().participants.find((p) => p.entityId === entityId);
  console.log(participant ? JSON.stringify(participant, null, 2) : `Unknown entity: ${entityId}`);
}

function showEvents() {
  for (const event of session.events.all()) console.log(`${event.sequence}. ${event.type}`, event);
}

function showEventsSince(sequence) {
  for (const event of session.events.since(sequence)) console.log(`${event.type}`, event);
}
