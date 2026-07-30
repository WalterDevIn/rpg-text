import { CombatBuilder } from "../game/simulation/combatBuilder.js";
import { CombatSession } from "../game/simulation/combatSession.js";
import { humanFighter } from "../content/characters/humanFighter.js";
import { humanWizard } from "../content/characters/humanWizard.js";
import { caveRat } from "../content/creatures/caveRat.js";
import { goblin } from "../content/creatures/goblin.js";
import { slime } from "../content/creatures/slime.js";
import { scenarios } from "../content/scenarios/index.js";
import { EncounterErrorCode, SideId, applicationError } from "../../../shared/src/index.js";

const sessions = new Map();
let nextSessionId = 1;
const characters = Object.freeze([humanFighter, humanWizard]);
const creatures = Object.freeze([goblin, caveRat, slime]);
const definitions = new Map([...characters, ...creatures].map((definition) => [definition.id, definition]));
const maxAutomaticActions = 100;

export function listEncounterCharacters() {
  return { ok: true, characters: characters.map(toParticipantSummary) };
}

export function listEncounterCreatures() {
  return { ok: true, creatures: creatures.map(toParticipantSummary) };
}

export function listEncounterScenarios() {
  return { ok: true, scenarios: scenarios.map(toScenarioSummary) };
}

export function validateEncounterSetup(input = {}) {
  const errors = [];
  const characterIds = Array.isArray(input.characterIds) ? input.characterIds : [];
  const creatureIds = Array.isArray(input.creatureIds) ? input.creatureIds : [];
  const participantIds = [...characterIds, ...creatureIds];
  const assignments = input.assignments && typeof input.assignments === "object" ? input.assignments : {};

  if (characterIds.length === 0) errors.push(applicationError(EncounterErrorCode.CHARACTER_REQUIRED, "Select at least one character."));
  if (creatureIds.length === 0) errors.push(applicationError(EncounterErrorCode.CREATURE_REQUIRED, "Select at least one creature."));
  if (!scenarios.some((scenario) => scenario.id === input.scenarioId)) {
    errors.push(applicationError(EncounterErrorCode.SCENARIO_REQUIRED, "Select a scenario."));
  }

  const uniqueIds = new Set(participantIds);
  if (uniqueIds.size !== participantIds.length) {
    errors.push(applicationError(EncounterErrorCode.DUPLICATE_PARTICIPANT, "A participant can only be selected once."));
  }
  for (const id of Object.keys(assignments)) {
    if (!uniqueIds.has(id)) errors.push(applicationError(EncounterErrorCode.UNKNOWN_PARTICIPANT, `Assignment provided for unselected participant: ${id}.`));
  }
  for (const id of participantIds) {
    if (!definitions.has(id)) errors.push(applicationError(EncounterErrorCode.UNKNOWN_PARTICIPANT, `Unknown participant: ${id}.`));
    if (![SideId.PARTY, SideId.HOSTILES].includes(assignments[id])) {
      errors.push(applicationError(EncounterErrorCode.SIDE_REQUIRED, `Assign ${id} to a side.`));
    }
  }
  const sides = new Set(participantIds.map((id) => assignments[id]));
  if (participantIds.length > 0 && sides.size < 2) {
    errors.push(applicationError(EncounterErrorCode.OPPOSING_SIDES_REQUIRED, "Assign participants to both Party and Hostiles."));
  }
  return { ok: errors.length === 0, errors };
}

export function createCombatSession(input = {}) {
  let { seed = 1, participants = [] } = input;
  let scenario = null;
  if (input.characterIds || input.creatureIds || input.scenarioId) {
    const validation = validateEncounterSetup(input);
    if (!validation.ok) return { ok: false, error: applicationError("INVALID_ENCOUNTER", "Encounter setup is invalid."), errors: validation.errors };
    scenario = scenarios.find((entry) => entry.id === input.scenarioId);
    participants = [...input.characterIds, ...input.creatureIds].map((id) => ({
      definition: definitions.get(id),
      overrides: { faction: input.assignments[id] === SideId.PARTY ? "heroes" : "monsters" },
    }));
  }
  if (!Array.isArray(participants) || participants.length < 2) {
    return { ok: false, error: applicationError("INVALID_REQUEST", "At least two participants are required") };
  }
  try {
    const builder = new CombatBuilder({ seed });
    for (const { definition, overrides = {} } of participants) builder.add(definition, overrides);
    const { session } = builder.build();
    session.start();
    const automatic = advanceAutomaticTurns(session);
    if (!automatic.ok) return automatic;
    const sessionId = `combat-${nextSessionId++}`;
    sessions.set(sessionId, session);
    return {
      ok: true,
      sessionId,
      scenario: scenario ? toScenarioSummary(scenario) : null,
      snapshot: session.snapshot(),
      events: session.events.all(),
      nextEventCursor: lastEventSequence(session),
      status: session.status,
    };
  } catch (error) {
    return { ok: false, error: applicationError("INVALID_REQUEST", error.message) };
  }
}

function toParticipantSummary(definition) {
  const view = new CombatSession();
  view.addParticipant(definition);
  const participant = view.snapshot().participants[0];
  const weapon = definition.weapon ?? null;
  const attack = weapon
    ? { name: weapon.name, attackBonus: (weapon.attack ?? weapon).attackBonus ?? null, damageDie: (weapon.attack ?? weapon).damageDie ?? null }
    : { name: "Unarmed strike", attackBonus: null, damageDie: null };
  return {
    id: definition.id,
    name: participant.identity.name,
    kind: definition.kind,
    role: definition.role ?? (definition.kind === "character" ? "Adventurer" : "Creature"),
    level: definition.level ?? null,
    hitPoints: participant.health,
    armorClass: participant.armorClass,
    controller: participant.controller,
    description: definition.description ?? "A combat-ready definition from the server content catalog.",
    attack,
  };
}

function toScenarioSummary(scenario) {
  return {
    id: scenario.id,
    name: scenario.name,
    description: scenario.description,
    startingDistance: scenario.startingDistance,
    cover: scenario.cover,
    terrain: scenario.terrain,
  };
}

export function getCombatSnapshot(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return { ok: false, error: applicationError("SESSION_NOT_FOUND") };
  return { ok: true, snapshot: session.snapshot(), nextEventCursor: lastEventSequence(session) };
}

export function submitCombatIntent(sessionId, intent) {
  const session = sessions.get(sessionId);
  if (!session) return { ok: false, error: applicationError("SESSION_NOT_FOUND") };
  const before = session.events.all().at(-1)?.sequence ?? 0;
  const result = session.submitIntent(intent);
  const automatic = result.ok === false ? { ok: true, actions: [] } : advanceAutomaticTurns(session);
  if (!automatic.ok) return automatic;
  return {
    ok: result.ok !== false,
    result,
    events: session.events.since(before),
    snapshot: session.snapshot(),
    nextEventCursor: lastEventSequence(session),
    automaticActions: automatic.actions,
    status: session.status,
    ...(result.ok === false ? { error: applicationError(result.reason) } : {}),
  };
}

export function getCombatEvents(sessionId, { since = 0 } = {}) {
  const session = sessions.get(sessionId);
  if (!session) return { ok: false, error: applicationError("SESSION_NOT_FOUND") };
  return { ok: true, events: session.events.since(since), nextEventCursor: lastEventSequence(session) };
}

function advanceAutomaticTurns(session) {
  const actions = [];
  while (session.status === "ACTIVE" && actions.length < maxAutomaticActions) {
    const snapshot = session.snapshot();
    const actor = snapshot.participants.find((participant) => participant.entityId === snapshot.activeEntityId);
    if (!actor || actor.controller !== "ai") break;
    const target = snapshot.participants.find((participant) => !participant.defeated && participant.faction !== actor.faction);
    const intent = target
      ? { type: "ATTACK", actorId: actor.entityId, targetId: target.entityId }
      : { type: "PASS", actorId: actor.entityId };
    const result = session.submitIntent(intent);
    actions.push({ intent, result });
    if (result.ok === false) {
      return { ok: false, error: applicationError("AI_ACTION_FAILED", "The server could not resolve an automatic creature turn.") };
    }
  }
  if (session.status === "ACTIVE" && session.snapshot().participants.find((participant) => participant.entityId === session.activeEntityId)?.controller === "ai") {
    return { ok: false, error: applicationError("AI_ACTION_LIMIT", "Automatic turn resolution exceeded its safety limit.") };
  }
  return { ok: true, actions };
}

function lastEventSequence(session) {
  return session.events.all().at(-1)?.sequence ?? 0;
}
