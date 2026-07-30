import { toParticipantSummary } from "../presenters/encounterPresenter.js";

export function listEncounterCharacters({ characterCatalog }) {
  return { ok: true, characters: characterCatalog.list().map(toParticipantSummary) };
}
