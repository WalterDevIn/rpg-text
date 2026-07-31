export const defaultEncounterDraft = Object.freeze({
  participants: [],
  scenarioId: null,
  ruleConfiguration: { seed: 2026 },
  currentStep: 1,
});

export function createEncounterDraft(value = {}) {
  const participants = Array.isArray(value.participants) ? value.participants : legacyParticipants(value);
  return {
    participants: participants.map((participant, index) => ({
      instanceKey: participant.instanceKey ?? `${participant.sourceId ?? participant.id}-${index + 1}`,
      sourceId: participant.sourceId ?? participant.id,
      displayName: participant.displayName ?? participant.name ?? participant.sourceId ?? participant.id,
      participantKind: participant.participantKind ?? participant.kind ?? "creature",
      side: participant.side ?? (participant.faction === "heroes" ? "party" : "hostiles"),
      controller: participant.controller ?? "ai",
    })),
    scenarioId: value.scenarioId ?? null,
    ruleConfiguration: { seed: 2026, ...(value.ruleConfiguration ?? value.rules ?? {}) },
    currentStep: Number.isInteger(value.currentStep ?? value.step) ? (value.currentStep ?? value.step) : 1,
  };
}

export function participantLabel(participant, allParticipants = []) {
  const matches = allParticipants.filter((entry) => entry.sourceId === participant.sourceId);
  return matches.length > 1 ? `${participant.displayName} ${matches.indexOf(participant) + 1}` : participant.displayName;
}

function legacyParticipants(value) {
  return [
    ...(value.characterIds ?? []).map((id) => ({ id, kind: "character", name: id, side: value.assignments?.[id] ?? "party", controller: value.controllers?.[id] ?? "manual" })),
    ...(value.creatureIds ?? []).map((id) => ({ id, kind: "creature", name: id, side: value.assignments?.[id] ?? "hostiles", controller: value.controllers?.[id] ?? "ai" })),
  ];
}
