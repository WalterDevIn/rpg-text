import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { createAudioPool } from "./audioPool.js";
import { soundCatalog } from "./soundCatalog.js";

export function createMobileAudioManager({ preferences, playerFactory = createAudioPlayer, random = Math.random } = {}) {
  const outputPool = createAudioPool({ source: soundCatalog.TYPEWRITER_KEY, size: 8, volume: 0.18, rateRange: [0.86, 1.14], playerFactory, random });
  const inputPool = createAudioPool({ source: soundCatalog.TYPEWRITER_KEY, size: 5, volume: 0.18, rateRange: [0.9, 1.1], playerFactory, random });
  const singleDie = createAudioPool({ source: soundCatalog.SINGLE_DIE, size: 1, volume: 0.72, playerFactory, random });
  const multipleDice = createAudioPool({ source: soundCatalog.MULTIPLE_DICE, size: 1, volume: 0.72, playerFactory, random });
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  const manager = {
    outputPool,
    inputPool,
    singleDie,
    multipleDice,
    playOutputCharacter() { if (enabled()) outputPool.play(preferences.get().masterVolume); },
    playInputCharacter() { if (enabled()) inputPool.play(preferences.get().masterVolume); },
    playDice(multiple = false) { if (enabled()) (multiple ? multipleDice : singleDie).play(preferences.get().masterVolume); },
    stop() { outputPool.stop(); inputPool.stop(); singleDie.stop(); multipleDice.stop(); },
  };
  const unsubscribe = preferences.subscribe(({ masterVolume }) => setVolume(masterVolume));
  setVolume(preferences.get().masterVolume);
  manager.dispose = () => { unsubscribe?.(); manager.stop(); };
  return manager;

  function enabled() { return preferences.get().soundEnabled; }
  function setVolume(masterVolume) { outputPool.setMasterVolume(masterVolume); inputPool.setMasterVolume(masterVolume); singleDie.setMasterVolume(masterVolume); multipleDice.setMasterVolume(masterVolume); }
}
