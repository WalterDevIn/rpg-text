export function createAudioPool({ src, size, volume, rateRange, AudioCtor = globalThis.Audio, random = Math.random } = {}) {
  const voices = AudioCtor ? Array.from({ length: size }, () => createVoice()) : [];
  let cursor = 0;
  return {
    size,
    voices,
    baseVolume: volume,
    play(masterVolume = 1) {
      if (!voices.length) return;
      const voice = voices[cursor++ % voices.length];
      voice.pause();
      voice.currentTime = 0;
      voice.volume = volume * masterVolume;
      voice.playbackRate = rateRange[0] + random() * (rateRange[1] - rateRange[0]);
      const playback = voice.play();
      if (playback?.catch) playback.catch(() => {});
    },
    setMasterVolume(masterVolume) { for (const voice of voices) voice.volume = volume * masterVolume; },
    stop() { for (const voice of voices) { voice.pause(); voice.currentTime = 0; } },
  };

  function createVoice() {
    const voice = new AudioCtor(src);
    voice.preload = "auto";
    voice.volume = volume;
    if ("preservePitch" in voice) voice.preservePitch = false;
    if ("mozPreservesPitch" in voice) voice.mozPreservesPitch = false;
    if ("webkitPreservesPitch" in voice) voice.webkitPreservesPitch = false;
    return voice;
  }
}
