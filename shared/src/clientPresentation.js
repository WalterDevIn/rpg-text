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

export function diceInfo(message) {
  return Object.values(message.references ?? {}).find((reference) => reference.kind === "DICE_ROLL" || reference.kind === "DAMAGE") ?? null;
}

export function isDiceMessage(message) { return message.origin === "dice" || message.type === "DICE_ROLLED" || Boolean(diceInfo(message)); }

export function isMultipleDice(message) {
  const reference = diceInfo(message);
  if (reference?.rolls?.length) return reference.rolls.length > 1;
  const notation = reference?.notation ?? message.notation ?? "";
  const match = String(notation).match(/^(\d+)d/i);
  return Number(match?.[1] ?? 1) > 1;
}

export function visibleSemanticSegments(segments = [], visibleCharacters = Infinity) {
  let remaining = visibleCharacters;
  return segments.flatMap((segment) => {
    const characters = Array.from(segment.text ?? "");
    const visible = Math.max(0, Math.min(characters.length, remaining));
    remaining -= visible;
    return visible ? [{ ...segment, text: characters.slice(0, visible).join(""), complete: segment.complete !== false && visible === characters.length }] : [];
  });
}

export function visibleText(segments = []) { return segments.map((segment) => segment.text ?? "").join(""); }

export function createTypewriter({ segments = [], onUpdate = () => {}, audioManager, scheduler = globalThis, animate = true, reducedMotion = false } = {}) {
  const characters = segments.map((segment) => ({ ...segment, characters: Array.from(segment.text ?? "") }));
  let timer = null;
  let cancelled = false;
  let resolveRun;
  const run = new Promise((resolve) => { resolveRun = resolve; });
  const immediate = !animate || reducedMotion;
  if (immediate) {
    onUpdate(segments.map((segment) => ({ ...segment, complete: true })));
    resolveRun();
  } else {
    onUpdate([]);
    reveal(0, 0);
  }
  return {
    promise: run,
    cancel({ complete = false } = {}) {
      if (cancelled) return;
      cancelled = true;
      if (timer !== null) scheduler.clearTimeout(timer);
      if (complete) onUpdate(segments.map((segment) => ({ ...segment })));
      resolveRun();
    },
  };

  function reveal(segmentIndex, characterIndex) {
    if (cancelled) return;
    if (segmentIndex >= characters.length) { resolveRun(); return; }
    const segment = characters[segmentIndex];
    if (characterIndex >= segment.characters.length) { reveal(segmentIndex + 1, 0); return; }
    segment.visible = `${segment.visible ?? ""}${segment.characters[characterIndex]}`;
    onUpdate(characters.map(({ visible, characters: ignoredCharacters, ...value }) => ({ ...value, text: visible ?? "", complete: (visible ?? "").length === ignoredCharacters.length })));
    audioManager?.playOutputCharacter();
    const delay = isPunctuation(segment.characters[characterIndex]) ? presentationPolicy.punctuationDelay : presentationPolicy.characterDelay;
    timer = scheduler.setTimeout(() => reveal(segmentIndex, characterIndex + 1), delay);
  }
}
