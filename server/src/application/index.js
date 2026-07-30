import { createApplication } from "./createApplication.js";

const application = createApplication();

export const {
  createCombatSession,
  getCombatEvents,
  getCombatSnapshot,
  listEncounterCharacters,
  listEncounterCreatures,
  listEncounterScenarios,
  submitCombatIntent,
  validateEncounterSetup,
  interpretCombatCommand,
  executeCombatCommand,
} = application;

export { createApplication } from "./createApplication.js";
