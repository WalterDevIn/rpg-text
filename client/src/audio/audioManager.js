import { createAudioPool } from "./audioPool.js";
import { soundCatalog } from "./soundCatalog.js";
import { createSoundPreferences } from "./soundPreferences.js";

export function createAudioManager({ AudioCtor = globalThis.Audio, random = Math.random, preferences = createSoundPreferences() } = {}) {
  const outputPool = createAudioPool({ src: soundCatalog.TYPEWRITER_KEY, size: 8, volume: 0.18, rateRange: [0.86, 1.14], AudioCtor, random });
  const inputPool = createAudioPool({ src: soundCatalog.TYPEWRITER_KEY, size: 5, volume: 0.18, rateRange: [0.9, 1.1], AudioCtor, random });
  const singleDie = createAudioPool({ src: soundCatalog.SINGLE_DIE, size: 1, volume: 0.72, rateRange: [1, 1], AudioCtor, random });
  const multipleDice = createAudioPool({ src: soundCatalog.MULTIPLE_DICE, size: 1, volume: 0.72, rateRange: [1, 1], AudioCtor, random });
  const manager = {
    preferences,
    outputPool,
    inputPool,
    singleDie,
    multipleDice,
    playOutputCharacter() { if (enabled()) outputPool.play(preferences.get().masterVolume); },
    playInputCharacter() { if (enabled()) inputPool.play(preferences.get().masterVolume); },
    playDice(multiple = false) { if (enabled()) (multiple ? multipleDice : singleDie).play(preferences.get().masterVolume); },
    setPreferences(next) { const updated = preferences.update(next); setVolume(updated.masterVolume); return updated; },
    stop() { outputPool.stop(); inputPool.stop(); singleDie.stop(); multipleDice.stop(); },
  };
  preferences.subscribe(({ masterVolume }) => setVolume(masterVolume));
  setVolume(preferences.get().masterVolume);
  return manager;

  function enabled() { return preferences.get().soundEnabled; }
  function setVolume(masterVolume) { outputPool.setMasterVolume(masterVolume); inputPool.setMasterVolume(masterVolume); singleDie.setMasterVolume(masterVolume); multipleDice.setMasterVolume(masterVolume); }
}
