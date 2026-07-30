export const ActionType = Object.freeze({
  ATTACK: "ATTACK",
  DODGE: "DODGE",
  PASS: "PASS",
});

export const ApplicationErrorCode = Object.freeze({
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  INVALID_REQUEST: "INVALID_REQUEST",
  INVALID_ENCOUNTER: "INVALID_ENCOUNTER",
});

export const SideId = Object.freeze({
  PARTY: "party",
  HOSTILES: "hostiles",
});

export const EncounterErrorCode = Object.freeze({
  CHARACTER_REQUIRED: "CHARACTER_REQUIRED",
  CREATURE_REQUIRED: "CREATURE_REQUIRED",
  SCENARIO_REQUIRED: "SCENARIO_REQUIRED",
  DUPLICATE_PARTICIPANT: "DUPLICATE_PARTICIPANT",
  UNKNOWN_PARTICIPANT: "UNKNOWN_PARTICIPANT",
  SIDE_REQUIRED: "SIDE_REQUIRED",
  OPPOSING_SIDES_REQUIRED: "OPPOSING_SIDES_REQUIRED",
});

/** @typedef {{ type: string, actorId: string, targetId?: string }} CombatIntent */
/** @typedef {{ status: string, round: number, activeEntityId: string|null, turnOrder: string[], participants: object[], history: object[] }} CombatSnapshot */
/** @typedef {{ sequence: number, type: string, [key: string]: unknown }} CombatEvent */
/** @typedef {{ characterIds: string[], creatureIds: string[], assignments: Record<string, string>, scenarioId: string, seed?: number }} EncounterSetupInput */
/** @typedef {{ id: string, name: string, kind: string, hitPoints: { current: number, max: number }, armorClass: number, controller: string, description: string, attack: object|null }} EncounterParticipantSummary */
/** @typedef {{ id: string, name: string, description: string, startingDistance: string, cover: string, terrain: string }} ScenarioSummary */
/** @typedef {{ sessionId: string, status: string, snapshot: CombatSnapshot, events: CombatEvent[], nextEventCursor: number }} CombatSessionResult */

export function applicationError(code, message = code) {
  return { code, message };
}
