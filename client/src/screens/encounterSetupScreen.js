import { SetupTabs } from "../components/setupTabs.js";
import { SelectionCard } from "../components/selectionCard.js";
import { SideAssignment } from "../components/sideAssignment.js";
import { EncounterSummary } from "../components/encounterSummary.js";
import { ConnectionSettings } from "../components/connectionSettings.js";
import { createEncounterState, encounterInput, reduceEncounterState, TabId } from "../app/state/encounterState.js";

const tabs = [
  { id: TabId.CHARACTERS, label: "Characters" },
  { id: TabId.CREATURES, label: "Creatures" },
  { id: TabId.SCENARIO, label: "Scenario" },
];

export function EncounterSetupScreen({ root, service, catalog, connectionStatus = "connected", onCombatCreated, onRetryConnection }) {
  let state = createEncounterState();
  const allEntries = [...catalog.characters, ...catalog.creatures];
  let validationVersion = 0;

  function dispatch(action) {
    state = reduceEncounterState(state, action);
    render();
    if (action.type !== "SET_TAB" && action.type !== "SET_LOADING" && action.type !== "SET_RESULT" && action.type !== "SET_ERROR") refreshValidation();
  }

  async function refreshValidation() {
    const currentVersion = ++validationVersion;
    const validation = await service.validateEncounterSetup(encounterInput(state));
    if (currentVersion !== validationVersion) return;
    state = reduceEncounterState(state, { type: "SET_VALIDATION", validation });
    render();
  }

  async function startCombat() {
    state = reduceEncounterState(state, { type: "SET_LOADING", loading: true });
    render();
    try {
      const result = await service.createCombatSession({ ...encounterInput(state), seed: 2026 });
      state = reduceEncounterState(state, { type: "SET_RESULT", result });
      onCombatCreated?.(result, catalog.scenarios.find((scenario) => scenario.id === result.scenario?.id));
      return;
    } catch (error) {
      state = reduceEncounterState(state, { type: "SET_ERROR", error });
    }
    render();
  }

  function render() {
    root.replaceChildren();
    const shell = document.createElement("main");
    shell.className = "app-stage setup-stage";
    shell.innerHTML = `<header class="setup-header"><div class="eyebrow">RPG TEXT / COMBAT PREPARATION</div><h1>Encounter setup</h1><p>Configure the opposing forces before the simulation begins.</p></header>`;
    shell.append(ConnectionSettings({ service, status: connectionStatus, onRetry: onRetryConnection }));
    shell.append(SetupTabs({ activeTab: state.activeTab, tabs, onChange: (tab) => dispatch({ type: "SET_TAB", tab }) }));

    const workspace = document.createElement("div");
    workspace.className = "setup-workspace";
    const content = document.createElement("section");
    content.className = "setup-content";
    content.append(renderTabContent());
    workspace.append(content);

    const summary = document.createElement("aside");
    summary.className = "setup-rail";
    summary.append(SideAssignment({ entries: selectedEntries(), assignments: state.assignments, onAssign: (id, side) => dispatch({ type: "ASSIGN_SIDE", id, side }) }));
    summary.append(EncounterSummary({
      entries: selectedEntries(),
      scenarios: catalog.scenarios,
      selectedScenarioId: state.selectedScenarioId,
      assignments: state.assignments,
      validation: state.validation,
      loading: state.loading,
      result: state.combatResult,
      error: state.applicationError,
      onStart: startCombat,
    }));
    workspace.append(summary);
    shell.append(workspace);
    root.append(shell);
  }

  function renderTabContent() {
    if (state.activeTab === TabId.SCENARIO) return renderScenarioPanel();
    const isCharacters = state.activeTab === TabId.CHARACTERS;
    const entries = isCharacters ? catalog.characters : catalog.creatures;
    const selectedIds = isCharacters ? state.selectedCharacterIds : state.selectedCreatureIds;
    const panel = document.createElement("section");
    panel.className = "selection-panel";
    panel.id = `panel-${state.activeTab}`;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", `tab-${state.activeTab}`);
    panel.tabIndex = 0;
    panel.innerHTML = `<div class="section-kicker">0${isCharacters ? "1" : "2"} / SELECT ${isCharacters ? "CHARACTERS" : "CREATURES"}</div><h2>${isCharacters ? "Choose your party" : "Choose your opposition"}</h2><p class="muted">${isCharacters ? "Select the player-controlled combatants entering the field." : "Select one or more server-defined creatures to face the party."}</p>`;
    const grid = document.createElement("div");
    grid.className = "selection-grid";
    for (const entry of entries) grid.append(SelectionCard({ entry, selected: selectedIds.includes(entry.id), tone: isCharacters ? "friendly" : "hostile", onToggle: (id) => dispatch({ type: isCharacters ? "TOGGLE_CHARACTER" : "TOGGLE_CREATURE", id }) }));
    panel.append(grid);
    return panel;
  }

  function renderScenarioPanel() {
    const panel = document.createElement("section");
    panel.className = "selection-panel scenario-panel";
    panel.id = "panel-scenario";
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", "tab-scenario");
    panel.tabIndex = 0;
    panel.innerHTML = `<div class="section-kicker">03 / SCENARIO</div><h2>Choose the field</h2><p class="muted">Scenario data prepares the encounter. Movement, cover, and terrain rules are not simulated yet.</p>`;
    const grid = document.createElement("div");
    grid.className = "scenario-grid";
    for (const scenario of catalog.scenarios) {
      const label = document.createElement("label");
      label.className = `scenario-card ${state.selectedScenarioId === scenario.id ? "is-selected" : ""}`;
      label.innerHTML = `<input type="radio" name="scenario" value="${scenario.id}" ${state.selectedScenarioId === scenario.id ? "checked" : ""}><span class="selection-marker">${state.selectedScenarioId === scenario.id ? "[x]" : "[ ]"}</span><span><strong>${scenario.name}</strong><small>${scenario.description}</small><small>Distance ${scenario.startingDistance} · Cover ${scenario.cover} · Terrain ${scenario.terrain}</small></span>`;
      label.querySelector("input").addEventListener("change", () => dispatch({ type: "SELECT_SCENARIO", id: scenario.id }));
      grid.append(label);
    }
    panel.append(grid);
    return panel;
  }

  function selectedEntries() {
    const ids = new Set([...state.selectedCharacterIds, ...state.selectedCreatureIds]);
    return allEntries.filter((entry) => ids.has(entry.id));
  }

  render();
  refreshValidation();
  return { getState: () => state };
}
