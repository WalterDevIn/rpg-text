const actorOrigins = new Set(["player", "creature"]);

export function createLocalCommandMessage({ actor, sequence, text }) {
  return {
    sequence,
    local: true,
    origin: "player",
    senderId: actor.entityId,
    senderName: actor.identity.name,
    senderKind: `actor:${actor.identity.kind}`,
    controlledLocally: true,
    text,
  };
}

export function toCombatMessages(events, snapshot) {
  const participants = new Map((snapshot?.participants ?? []).map((participant) => [participant.entityId, participant]));
  return events.map((event) => {
    if (event.local) {
      return {
        ...event,
        senderKind: event.senderKind ?? "actor",
        senderId: event.senderId ?? event.sequence,
        senderName: event.senderName ?? "Unknown actor",
        controlledLocally: event.controlledLocally === true,
        alignment: event.controlledLocally === true ? "right" : "left",
        text: event.text ?? "",
      };
    }

    const actorId = actorIdFor(event);
    const actor = actorId ? participants.get(actorId) : null;
    const actorMessage = actor && actorOrigins.has(event.origin);
    const senderKind = actorMessage ? `actor:${actor.identity.kind}` : event.origin ?? "system";
    const senderId = actorMessage ? actor.entityId : senderKind;
    const controlledLocally = actorMessage && event.origin === "player" && actor.controller === "manual";
    return {
      ...event,
      senderKind,
      senderId,
      senderName: actorMessage ? actor.identity.name : senderLabel(event.origin),
      controlledLocally,
      alignment: controlledLocally ? "right" : "left",
      text: event.text ?? eventMessageText(event),
    };
  });
}

export function groupCombatMessages(messages) {
  let previousKey = null;
  return messages.map((message) => {
    const groupingKey = `${message.senderKind}:${message.senderId}`;
    const grouped = groupingKey === previousKey;
    previousKey = groupingKey;
    return { ...message, groupingKey, showSenderLabel: !grouped };
  });
}

export function actorIdFor(event) {
  const directId = event.entityId ?? event.actorId ?? event.sourceId;
  if (directId) return directId;
  const segmentReference = event.segments?.find((segment) => segment.semantic?.referenceId?.startsWith("entity:"))?.semantic?.referenceId;
  if (segmentReference) return segmentReference.slice("entity:".length);
  return Object.keys(event.references ?? {}).find((referenceId) => referenceId.startsWith("entity:"))?.slice("entity:".length) ?? null;
}

export function senderLabel(origin) {
  return { dm: "Dungeon Master", dice: "Dice", system: "System" }[origin] ?? "System";
}

function eventMessageText(event) {
  if (event.segments) return event.segments.map((segment) => segment.text ?? "").join("");
  if (event.semantic?.segments) return event.semantic.segments.map((segment) => segment.text ?? "").join("");
  if (event.type === "DICE_ROLLED") return `${event.purpose}: ${event.notation ?? "roll"} = ${event.total ?? event.naturalRoll}`;
  return event.type?.replaceAll("_", " ") ?? "";
}
