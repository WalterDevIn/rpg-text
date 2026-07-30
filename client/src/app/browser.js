import { combatService } from "../services/combatService.js";
import { EncounterSetupScreen } from "../screens/encounterSetupScreen.js";
import { CombatScreen } from "../screens/combatScreen.js";
import { ConnectionSettings } from "../components/connectionSettings.js";

const root = document.querySelector("#app");

loadEncounterContent();

async function loadEncounterContent() {
  const loading = document.createElement("main");
  loading.className = "app-stage startup-state";
  loading.innerHTML = `<div class="eyebrow">RPG TEXT / SYSTEM</div><h1>Loading encounter content</h1><p>Connecting to the authoritative server...</p>`;
  loading.append(ConnectionSettings({ service: combatService, status: "connecting", onRetry: loadEncounterContent }));
  root.replaceChildren(loading);
  try {
    const [characters, creatures, scenarios] = await Promise.all([
      combatService.listEncounterCharacters(),
      combatService.listEncounterCreatures(),
      combatService.listEncounterScenarios(),
    ]);
    const catalog = { characters: characters.characters, creatures: creatures.creatures, scenarios: scenarios.scenarios };
    renderSetup(catalog, "connected");
  } catch (error) {
    const failure = document.createElement("main");
    failure.className = "app-stage startup-error";
    failure.innerHTML = `<div class="eyebrow">RPG TEXT / SYSTEM</div><h1>Unable to load encounter content</h1><p>${escapeHtml(error.message)}</p>`;
    failure.append(ConnectionSettings({ service: combatService, status: "unavailable", onRetry: loadEncounterContent }));
    root.replaceChildren(failure);
  }
}

function renderSetup(catalog, connectionStatus) {
  EncounterSetupScreen({
    root,
    service: combatService,
    catalog,
    connectionStatus,
    onRetryConnection: loadEncounterContent,
    onCombatCreated: (result, scenario) => CombatScreen({ root, service: combatService, sessionId: result.sessionId, snapshot: result.snapshot, events: result.events ?? [], scenario, onReturn: () => renderSetup(catalog, "connected") }),
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}
