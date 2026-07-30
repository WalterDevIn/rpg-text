import { characterCatalog } from "../content/catalog/characterCatalog.js";
import { creatureCatalog } from "../content/catalog/creatureCatalog.js";
import { scenarioCatalog } from "../content/catalog/scenarioCatalog.js";
import { createInMemoryCombatSessionRepository } from "../infrastructure/persistence/inMemoryCombatSessionRepository.js";
import { listEncounterCharacters, listEncounterCreatures, listEncounterScenarios, validateEncounterSetup } from "./encounters/index.js";
import { createCombatSession, getCombatSession, getCombatEvents, submitCombatIntent } from "./combatSessions/index.js";
import { interpretCombatCommand } from "./interpretation/interpretCombatCommand.js";
import { executeCombatCommand } from "./interpretation/executeCombatCommand.js";
import { presentInterpretation } from "./interpretation/presentInterpretation.js";

export function createApplication({ sessionRepository = createInMemoryCombatSessionRepository() } = {}) {
  const dependencies = { characterCatalog, creatureCatalog, scenarioCatalog, sessionRepository };
  return {
    listEncounterCharacters: () => listEncounterCharacters(dependencies),
    listEncounterCreatures: () => listEncounterCreatures(dependencies),
    listEncounterScenarios: () => listEncounterScenarios(dependencies),
    validateEncounterSetup: (input) => validateEncounterSetup(input, dependencies),
    createCombatSession: (input) => createCombatSession(input, dependencies),
    getCombatSnapshot: (sessionId) => getCombatSession(sessionId, dependencies),
    getCombatEvents: (sessionId, options) => getCombatEvents(sessionId, { ...options, ...dependencies }),
    submitCombatIntent: (sessionId, intent) => submitCombatIntent(sessionId, intent, dependencies),
    interpretCombatCommand: (sessionId, text) => {
      const result = interpretCombatCommand(sessionId, text, dependencies);
      return result.ok ? { ...result, interpretation: presentInterpretation(result.interpretation) } : result;
    },
    executeCombatCommand: (sessionId, text) => {
      const result = executeCombatCommand(sessionId, text, dependencies);
      return result.interpretation ? { ...result, interpretation: presentInterpretation(result.interpretation) } : result;
    },
  };
}
