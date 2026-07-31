export const presentationPolicy = Object.freeze({
  entranceDuration: 240,
  dwell: 90,
  characterDelay: 24,
  punctuationDelay: 65,
  diceInterval: 1000,
  sourceDelay: Object.freeze({ player: 0, dice: 110, creature: 220, dm: 380, system: 380 }),
});

export function sourceDelay(message) { return presentationPolicy.sourceDelay[message.origin] ?? presentationPolicy.sourceDelay.dm; }
export function isPunctuation(character) { return ".,;:!?".includes(character); }
export function diceInfo(message) { return Object.values(message.references ?? {}).find((reference) => reference.kind === "DICE_ROLL" || reference.kind === "DAMAGE") ?? null; }
export function isDiceMessage(message) { return message.origin === "dice" || message.type === "DICE_ROLLED" || Boolean(diceInfo(message)); }
