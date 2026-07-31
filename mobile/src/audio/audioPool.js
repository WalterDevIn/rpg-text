export function createAudioPool({ source, size, volume, rateRange = [1, 1], playerFactory, random = Math.random } = {}) {
  const players = Array.from({ length: size }, () => playerFactory(source));
  let cursor = 0;
  let disposed = false;
  return {
    size,
    players,
    baseVolume: volume,
    play(masterVolume = 1) {
      if (disposed || !players.length) return;
      const player = players[cursor++ % players.length];
      try {
        player.pause();
        player.volume = volume * masterVolume;
        const playbackRate = rateRange[0] + random() * (rateRange[1] - rateRange[0]);
        if (typeof player.setPlaybackRate === "function") player.setPlaybackRate(playbackRate);
        else player.playbackRate = playbackRate;
        Promise.resolve(player.seekTo?.(0)).catch(() => {}).then(() => {
          if (disposed) return;
          const playback = player.play();
          playback?.catch?.((error) => reportPlaybackError(source, error));
        });
      } catch (error) {
        reportPlaybackError(source, error);
      }
    },
    setMasterVolume(masterVolume) { for (const player of players) player.volume = volume * masterVolume; },
    stop() { disposed = true; for (const player of players) { try { player.pause(); player.remove?.(); } catch (error) { reportPlaybackError(source, error); } } },
  };
}

function reportPlaybackError(source, error) {
  if (error?.name !== "NotAllowedError") console.warn(`[mobile-audio] Could not play ${String(source)}: ${error?.message ?? error}`);
}
