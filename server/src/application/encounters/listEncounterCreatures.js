import { toParticipantSummary } from "../presenters/encounterPresenter.js";

export function listEncounterCreatures({ creatureCatalog }) {
  return { ok: true, creatures: creatureCatalog.list().map(toParticipantSummary) };
}
