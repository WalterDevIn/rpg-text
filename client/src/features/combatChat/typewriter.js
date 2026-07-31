import { isPunctuation, presentationPolicy } from "./messagePresentationPolicy.js";

export function createTypewriter({ segments, onUpdate, audioManager, scheduler = globalThis, animate = true, reducedMotion = false } = {}) {
  const characters = segments.map((segment) => ({ ...segment, characters: Array.from(segment.text ?? "") }));
  let timer = null;
  let cancelled = false;
  let resolveRun;
  const run = new Promise((resolve) => { resolveRun = resolve; });
  const immediate = !animate || reducedMotion;
  if (immediate) {
    onUpdate(cloneSegments(segments));
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
      if (complete) onUpdate(cloneSegments(segments));
      resolveRun();
    },
  };

  function reveal(segmentIndex, characterIndex) {
    if (cancelled) return;
    if (segmentIndex >= characters.length) { resolveRun(); return; }
    const segment = characters[segmentIndex];
    if (characterIndex >= segment.characters.length) { reveal(segmentIndex + 1, 0); return; }
    segment.visible = `${segment.visible ?? ""}${segment.characters[characterIndex]}`;
    onUpdate(characters.map(({ visible, ...value }) => ({ ...value, text: visible ?? "" })));
    audioManager?.playOutputCharacter();
    const delay = isPunctuation(segment.characters[characterIndex]) ? presentationPolicy.punctuationDelay : presentationPolicy.characterDelay;
    timer = scheduler.setTimeout(() => reveal(segmentIndex, characterIndex + 1), delay);
  }
}

function cloneSegments(segments) { return segments.map((segment) => ({ ...segment })); }
