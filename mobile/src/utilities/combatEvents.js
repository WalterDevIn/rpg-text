export function mergeCombatEvents(existing, incoming) {
  const bySequence = new Map(existing.map((event) => [event.sequence, event]));
  for (const event of incoming) if (!bySequence.has(event.sequence)) bySequence.set(event.sequence, event);
  return [...bySequence.values()].sort((left, right) => compareSequences(left.sequence, right.sequence));
}

export function eventMessage(event) {
  if (event.segments) return event.segments.map((segment) => segment.text ?? "").join("");
  if (event.semantic?.segments) return event.semantic.segments.map((segment) => segment.text ?? "").join("");
  if (event.text) return event.text;
  if (event.type === "DICE_ROLLED") return `${event.purpose}: ${event.notation ?? "roll"} = ${event.total ?? event.naturalRoll}`;
  return event.type.replaceAll("_", " ");
}

function compareSequences(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) return leftNumber - rightNumber;
  if (Number.isFinite(leftNumber)) return -1;
  if (Number.isFinite(rightNumber)) return 1;
  return String(left).localeCompare(String(right));
}
