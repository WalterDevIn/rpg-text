export function createAudioPool({ source, size, volume, rateRange = [1, 1], playerFactory, random = Math.random } = {}) {
  const players = Array.from({ length: size }, () => playerFactory(source));
  let cursor = 0;
  return {
    size,
    players,
    baseVolume: volume,
    play(masterVolume = 1) {
      if (!players.length) return;
      const player = players[cursor++ % players.length];
      try {
        player.pause();
        player.volume = volume * masterVolume;
        player.playbackRate = rateRange[0] + random() * (rateRange[1] - rateRange[0]);
        const reset = player.seekTo?.(0);
        reset?.catch?.(() => {});
        player.play();
      } catch (error) {
        reportPlaybackError(source, error);
      }
    },
    setMasterVolume(masterVolume) { for (const player of players) player.volume = volume * masterVolume; },
    stop() { for (const player of players) { try { player.pause(); player.remove?.(); } catch (error) { reportPlaybackError(source, error); } } },
  };
}

function reportPlaybackError(source, error) {
  if (error?.name !== "NotAllowedError") console.warn(`[mobile-audio] Could not play ${String(source)}: ${error?.message ?? error}`);
}
