import { toScenarioSummary } from "../presenters/encounterPresenter.js";

export function listEncounterScenarios({ scenarioCatalog }) {
  return { ok: true, scenarios: scenarioCatalog.list().map(toScenarioSummary) };
}
