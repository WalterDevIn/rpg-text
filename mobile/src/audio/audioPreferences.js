import AsyncStorage from "@react-native-async-storage/async-storage";

const storageKey = "rpg-text-presentation-preferences";
const defaults = Object.freeze({ soundEnabled: true, masterVolume: 1, textAnimationEnabled: true, reducedMotion: false });

export function createMobilePresentationPreferences({ storage = AsyncStorage } = {}) {
  let values = { ...defaults };
  const listeners = new Set();
  return {
    get: () => ({ ...values }),
    async load() {
      try { const stored = await storage?.getItem(storageKey); if (stored) values = sanitize({ ...values, ...JSON.parse(stored) }); } catch { values = { ...defaults }; }
      notify();
      return { ...values };
    },
    update(next) {
      values = sanitize({ ...values, ...next });
      const result = storage?.setItem(storageKey, JSON.stringify(values));
      result?.catch?.(() => {});
      notify();
      return { ...values };
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    defaults,
  };

  function notify() { for (const listener of listeners) listener({ ...values }); }
}

function sanitize(values) {
  return {
    soundEnabled: values.soundEnabled !== false,
    masterVolume: Math.min(1, Math.max(0, Number.isFinite(Number(values.masterVolume)) ? Number(values.masterVolume) : 1)),
    textAnimationEnabled: values.textAnimationEnabled !== false,
    reducedMotion: values.reducedMotion === true,
  };
}
