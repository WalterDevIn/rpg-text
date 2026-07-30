import { SideId } from "../../../../shared/src/index.js";

export const TabId = Object.freeze({
  CHARACTERS: "characters",
  CREATURES: "creatures",
  SCENARIO: "scenario",
});

export function createEncounterState() {
  return {
    activeTab: TabId.CHARACTERS,
    selectedCharacterIds: [],
    selectedCreatureIds: [],
    assignments: {},
    selectedScenarioId: null,
    loading: false,
    validation: { ok: false, errors: [] },
    combatResult: null,
    applicationError: null,
  };
}

export function encounterInput(state) {
  return {
    characterIds: [...state.selectedCharacterIds],
    creatureIds: [...state.selectedCreatureIds],
    assignments: { ...state.assignments },
    scenarioId: state.selectedScenarioId,
  };
}

export function reduceEncounterState(state, action) {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, activeTab: action.tab };
    case "TOGGLE_CHARACTER":
      return toggleParticipant(state, "selectedCharacterIds", action.id, SideId.PARTY);
    case "TOGGLE_CREATURE":
      return toggleParticipant(state, "selectedCreatureIds", action.id, SideId.HOSTILES);
    case "ASSIGN_SIDE":
      return { ...state, assignments: { ...state.assignments, [action.id]: action.side } };
    case "SELECT_SCENARIO":
      return { ...state, selectedScenarioId: action.id };
    case "SET_VALIDATION":
      return { ...state, validation: action.validation };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_RESULT":
      return { ...state, loading: false, combatResult: action.result, applicationError: null };
    case "SET_ERROR":
      return { ...state, loading: false, combatResult: null, applicationError: action.error };
    default:
      return state;
  }
}

function toggleParticipant(state, key, id, defaultSide) {
  const selected = state[key].includes(id);
  const ids = selected ? state[key].filter((value) => value !== id) : [...state[key], id];
  const assignments = { ...state.assignments };
  if (selected) delete assignments[id];
  else assignments[id] = assignments[id] ?? defaultSide;
  return { ...state, [key]: ids, assignments };
}
