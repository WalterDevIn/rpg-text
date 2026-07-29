import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { CombatBuilder } from "../game/simulation/combatBuilder.js";
import { humanFighter } from "../content/characters/humanFighter.js";
import { humanWizard } from "../content/characters/humanWizard.js";
import { goblin } from "../content/creatures/goblin.js";
import { caveRat } from "../content/creatures/caveRat.js";
import { slime } from "../content/creatures/slime.js";

const catalog = { fighter: humanFighter, wizard: humanWizard, goblin, rat: caveRat, slime };
const rl = readline.createInterface({ input, output });
const builder = new CombatBuilder({ seed: 2026 });

builder
  .add(humanFighter, { name: "Walter", faction: "heroes", controller: "player" })
  .add(humanWizard, { name: "Mira", faction: "heroes", controller: "manual" })
  .add(goblin, { name: "Goblin A", faction: "monsters" })
  .add(caveRat, { name: "Cave Rat", faction: "monsters" });

const { session } = builder.build();
session.start();
console.log("RPG Text · Combat Core v0.2");
console.log("Commands: status, inspect <id>, attack <id>, dodge, pass, events, add <catalog>, quit");
showStatus();

while (session.status === "ACTIVE") {
  const active = session.snapshot().participants.find((p) => p.entityId === session.activeEntityId);
  const raw = (await rl.question(`\nRound ${session.round} · ${active.identity.name}> `)).trim();
  if (!raw) continue;
  const [command, argument] = raw.split(/\s+/, 2);

  if (command === "quit") break;
  if (command === "status") { showStatus(); continue; }
  if (command === "events") { showEvents(); continue; }
  if (command === "inspect") { inspect(argument); continue; }
  if (command === "add") {
    console.log(catalog[argument] ? "Participants can only be added before combat starts." : `Unknown catalog entry: ${argument}`);
    continue;
  }

  const intent = toIntent(command, argument);
  if (!intent) { console.log("Unknown command."); continue; }
  const result = session.submitIntent(intent);
  if (!result.ok) console.log(`Rejected: ${result.reason}`);
  else showRecentEvents();
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
  console.log(participant ?? `Unknown entity: ${entityId}`);
}

function showEvents() {
  for (const event of session.events.all()) console.log(`${event.sequence}. ${event.type}`, event.payload);
}

function showRecentEvents() {
  for (const event of session.events.all().slice(-6)) console.log(`${event.type}`, event.payload);
}