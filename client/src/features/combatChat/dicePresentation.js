export function isMultipleDice(message) {
  const reference = Object.values(message.references ?? {}).find((entry) => entry.kind === "DICE_ROLL" || entry.kind === "DAMAGE");
  if (reference?.rolls?.length) return reference.rolls.length > 1;
  const notation = reference?.notation ?? message.notation ?? "";
  const match = String(notation).match(/^(\d+)d/i);
  return Number(match?.[1] ?? 1) > 1;
}
