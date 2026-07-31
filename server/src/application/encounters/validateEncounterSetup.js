import { EncounterErrorCode, SideId, applicationError } from "../../../../shared/src/index.js";

export function validateEncounterSetup(input = {}, { characterCatalog, creatureCatalog, scenarioCatalog }) {
  if (isStructuredParticipants(input.participants)) return validateParticipantDraft(input, { characterCatalog, creatureCatalog, scenarioCatalog });
  const errors = [];
  const characterIds = Array.isArray(input.characterIds) ? input.characterIds : [];
  const creatureIds = Array.isArray(input.creatureIds) ? input.creatureIds : [];
  const participantIds = [...characterIds, ...creatureIds];
  const assignments = input.assignments && typeof input.assignments === "object" ? input.assignments : {};
  if (characterIds.length === 0) errors.push(applicationError(EncounterErrorCode.CHARACTER_REQUIRED, "Select at least one character."));
  if (creatureIds.length === 0) errors.push(applicationError(EncounterErrorCode.CREATURE_REQUIRED, "Select at least one creature."));
  if (!scenarioCatalog.has(input.scenarioId)) errors.push(applicationError(EncounterErrorCode.SCENARIO_REQUIRED, "Select a scenario."));
  const uniqueIds = new Set(participantIds);
  if (uniqueIds.size !== participantIds.length) errors.push(applicationError(EncounterErrorCode.DUPLICATE_PARTICIPANT, "A participant can only be selected once."));
  for (const id of Object.keys(assignments)) {
    if (!uniqueIds.has(id)) errors.push(applicationError(EncounterErrorCode.UNKNOWN_PARTICIPANT, `Assignment provided for unselected participant: ${id}.`));
  }
  for (const id of participantIds) {
    if (!characterCatalog.has(id) && !creatureCatalog.has(id)) errors.push(applicationError(EncounterErrorCode.UNKNOWN_PARTICIPANT, `Unknown participant: ${id}.`));
    if (![SideId.PARTY, SideId.HOSTILES].includes(assignments[id])) errors.push(applicationError(EncounterErrorCode.SIDE_REQUIRED, `Assign ${id} to a side.`));
  }
  if (participantIds.length > 0 && new Set(participantIds.map((id) => assignments[id])).size < 2) errors.push(applicationError(EncounterErrorCode.OPPOSING_SIDES_REQUIRED, "Assign participants to both Party and Hostiles."));
  return { ok: errors.length === 0, errors };
}

function isStructuredParticipants(participants) { return Array.isArray(participants) && participants.every((participant) => participant && typeof participant.sourceId === "string"); }

function validateParticipantDraft(input, { characterCatalog, creatureCatalog, scenarioCatalog }) {
  const errors = [];
  const participants = input.participants;
  if (participants.length === 0) errors.push(applicationError(EncounterErrorCode.CHARACTER_REQUIRED, "Select at least one participant."));
  const instanceKeys = new Set();
  const sides = new Set();
  for (const participant of participants) {
    const sourceId = participant?.sourceId;
    const kind = participant?.participantKind;
    const catalog = kind === "character" ? characterCatalog : kind === "creature" ? creatureCatalog : null;
    if (!sourceId || !catalog?.has(sourceId)) errors.push(applicationError(EncounterErrorCode.UNKNOWN_PARTICIPANT, `Unknown participant: ${sourceId ?? "(missing)"}.`));
    if (!participant.instanceKey || instanceKeys.has(participant.instanceKey)) errors.push(applicationError(EncounterErrorCode.DUPLICATE_PARTICIPANT, "Each encounter instance needs a unique key."));
    instanceKeys.add(participant.instanceKey);
    if (![SideId.PARTY, SideId.HOSTILES].includes(participant.side)) errors.push(applicationError(EncounterErrorCode.SIDE_REQUIRED, `Assign ${sourceId ?? "participant"} to a side.`));
    else sides.add(participant.side);
    if (!["manual", "ai"].includes(participant.controller)) errors.push(applicationError(EncounterErrorCode.INVALID_CONTROLLER, `Choose a valid controller for ${sourceId ?? "participant"}.`));
  }
  if (!sides.has(SideId.PARTY)) errors.push(applicationError(EncounterErrorCode.CHARACTER_REQUIRED, "Add at least one participant to Your Group."));
  if (!sides.has(SideId.HOSTILES)) errors.push(applicationError(EncounterErrorCode.CREATURE_REQUIRED, "Add at least one participant to Opponents."));
  if (!scenarioCatalog.has(input.scenarioId)) errors.push(applicationError(EncounterErrorCode.SCENARIO_REQUIRED, "Select a scenario."));
  return { ok: errors.length === 0, errors };
}
