const storageKey = "rpg-text-presentation-preferences";
const defaults = Object.freeze({ soundEnabled: true, masterVolume: 1, textAnimationEnabled: true });

export function createSoundPreferences({ storage = globalThis.localStorage } = {}) {
  let values = { ...defaults };
  try {
    const stored = storage?.getItem(storageKey);
    if (stored) values = sanitize({ ...values, ...JSON.parse(stored) });
  } catch {
    values = { ...defaults };
  }
  const listeners = new Set();
  return {
    get: () => ({ ...values }),
    update(next) {
      values = sanitize({ ...values, ...next });
      try { storage?.setItem(storageKey, JSON.stringify(values)); } catch { /* storage is optional */ }
      for (const listener of listeners) listener({ ...values });
      return { ...values };
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    defaults,
  };
}

export function prefersReducedMotion({ matchMedia = globalThis.matchMedia } = {}) {
  try { return Boolean(matchMedia?.("(prefers-reduced-motion: reduce)").matches); } catch { return false; }
}

function sanitize(values) {
  return {
    soundEnabled: values.soundEnabled !== false,
    masterVolume: Math.min(1, Math.max(0, Number.isFinite(Number(values.masterVolume)) ? Number(values.masterVolume) : 1)),
    textAnimationEnabled: values.textAnimationEnabled !== false,
  };
}
