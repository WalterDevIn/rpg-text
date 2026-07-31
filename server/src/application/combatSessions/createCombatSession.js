import { CombatBuilder } from "../../game/simulation/combatBuilder.js";
import { applicationError, SideId } from "../../../../shared/src/index.js";
import { toScenarioSummary } from "../presenters/encounterPresenter.js";
import { validateEncounterSetup } from "../encounters/validateEncounterSetup.js";
import { advanceAutomaticTurns } from "../ai/advanceAutomaticTurns.js";
import { presentEvents } from "../presentation/presentEvents.js";

export function createCombatSession(input = {}, dependencies) {
  let { seed = 1, participants = [] } = input;
  let scenario = null;
  if (isStructuredParticipants(input.participants) || input.characterIds || input.creatureIds || input.scenarioId) {
    const validation = validateEncounterSetup(input, dependencies);
    if (!validation.ok) return { ok: false, error: applicationError("INVALID_ENCOUNTER", "Encounter setup is invalid."), errors: validation.errors };
    scenario = dependencies.scenarioCatalog.findById(input.scenarioId);
    participants = Array.isArray(input.participants)
      ? input.participants.map((participant) => ({
        definition: participant.participantKind === "character" ? dependencies.characterCatalog.findById(participant.sourceId) : dependencies.creatureCatalog.findById(participant.sourceId),
        overrides: { name: participant.displayName, faction: participant.side === SideId.PARTY ? "heroes" : "monsters", controller: participant.controller },
      }))
      : [...input.characterIds, ...input.creatureIds].map((id) => ({
        definition: dependencies.characterCatalog.findById(id) ?? dependencies.creatureCatalog.findById(id),
        overrides: { faction: input.assignments[id] === SideId.PARTY ? "heroes" : "monsters" },
      }));
  }
  if (!Array.isArray(participants) || participants.length < 2) return { ok: false, error: applicationError("INVALID_REQUEST", "At least two participants are required") };
  try {
    const builder = new CombatBuilder({ seed });
    for (const { definition, overrides = {} } of participants) builder.add(definition, overrides);
    const { session } = builder.build();
    session.start();
    const automatic = advanceAutomaticTurns(session);
    if (!automatic.ok) return automatic;
    const sessionId = dependencies.sessionRepository.allocateId();
    dependencies.sessionRepository.save(sessionId, session);
    const snapshot = session.snapshot();
    return { ok: true, sessionId, scenario: scenario ? toScenarioSummary(scenario) : null, snapshot, events: presentEvents(session.events.all(), snapshot), nextEventCursor: lastEventSequence(session), status: session.status };
  } catch (error) {
    return { ok: false, error: applicationError("INVALID_REQUEST", error.message) };
  }
}

function isStructuredParticipants(participants) { return Array.isArray(participants) && participants.every((participant) => participant && typeof participant.sourceId === "string"); }

function lastEventSequence(session) { return session.events.all().at(-1)?.sequence ?? 0; }
