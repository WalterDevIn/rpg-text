import test from "node:test";
import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { soundCatalog } from "../src/audio/soundCatalog.js";
import { createAudioManager } from "../src/audio/audioManager.js";
import { createSoundPreferences } from "../src/audio/soundPreferences.js";
import { shouldPlayInputSound } from "../src/audio/inputSound.js";
import { createTypewriter } from "../src/features/combatChat/typewriter.js";
import { presentationPolicy } from "../src/features/combatChat/messagePresentationPolicy.js";
import { createMessagePresentationQueue } from "../src/features/combatChat/messagePresentationQueue.js";

class FakeAudio {
  static instances = [];
  constructor(src) { this.src = src; this.preload = ""; this.volume = 0; this.playbackRate = 1; this.currentTime = 0; this.paused = true; this.playCalls = 0; FakeAudio.instances.push(this); }
  pause() { this.paused = true; }
  play() { this.paused = false; this.playCalls += 1; return Promise.resolve(); }
}

test("sound catalog points to the existing public assets", async () => {
  for (const path of Object.values(soundCatalog)) await stat(new URL(`../public${path}`, import.meta.url));
});

test("audio pools use required sizes, base volumes, and bounded playback rates", () => {
  FakeAudio.instances = [];
  const preferences = createSoundPreferences({ storage: null });
  const manager = createAudioManager({ AudioCtor: FakeAudio, random: () => .5, preferences });
  assert.equal(manager.outputPool.size, 8);
  assert.equal(manager.inputPool.size, 5);
  assert.equal(manager.outputPool.baseVolume, .18);
  assert.equal(manager.inputPool.baseVolume, .18);
  manager.playOutputCharacter();
  manager.playInputCharacter();
  manager.playDice(false);
  manager.playDice(true);
  assert.ok(manager.outputPool.voices[0].playbackRate >= .86 && manager.outputPool.voices[0].playbackRate <= 1.14);
  assert.ok(manager.inputPool.voices[0].playbackRate >= .9 && manager.inputPool.voices[0].playbackRate <= 1.1);
  assert.equal(manager.singleDie.voices[0].src, soundCatalog.SINGLE_DIE);
  assert.equal(manager.multipleDice.voices[0].src, soundCatalog.MULTIPLE_DICE);
  manager.setPreferences({ masterVolume: .5 });
  assert.equal(manager.outputPool.voices[0].volume, .09);
});

test("input sound only accepts printable, non-modified, non-composition keys", () => {
  const base = { ctrlKey: false, metaKey: false, altKey: false, isComposing: false };
  assert.equal(shouldPlayInputSound({ ...base, key: "ñ" }), true);
  assert.equal(shouldPlayInputSound({ ...base, key: " " }), true);
  for (const key of ["Shift", "Enter", "Backspace", "Delete", "ArrowLeft", "Tab", "Escape"]) assert.equal(shouldPlayInputSound({ ...base, key }), false, key);
  assert.equal(shouldPlayInputSound({ ...base, key: "a", ctrlKey: true }), false);
  assert.equal(shouldPlayInputSound({ ...base, key: "a", isComposing: true }), false);
  assert.equal(shouldPlayInputSound({ ...base, key: "a" }, true), false);
});

test("typewriter reveals Unicode characters with punctuation pauses and one sound per character", async () => {
  const timers = [];
  const scheduler = { setTimeout(callback, delay) { timers.push({ callback, delay }); return timers.length - 1; }, clearTimeout() {} };
  const updates = [];
  let sounds = 0;
  const controller = createTypewriter({ segments: [{ text: "¡Ñ." }], scheduler, audioManager: { playOutputCharacter: () => { sounds += 1; } }, onUpdate: (segments) => updates.push(segments.map(({ text }) => text).join("")) });
  assert.deepEqual(updates, ["", "¡"]);
  assert.equal(timers.at(-1).delay, presentationPolicy.characterDelay);
  timers.shift().callback(); await Promise.resolve();
  assert.equal(updates.at(-1), "¡Ñ");
  assert.equal(timers.at(-1).delay, presentationPolicy.characterDelay);
  timers.shift().callback(); await Promise.resolve();
  assert.equal(updates.at(-1), "¡Ñ.");
  assert.equal(sounds, 3);
  assert.equal(timers.at(-1).delay, presentationPolicy.punctuationDelay);
  timers.shift().callback(); await Promise.resolve();
  await controller.promise;
});

test("typewriter can complete immediately without output sound", async () => {
  let sounds = 0;
  const updates = [];
  const controller = createTypewriter({ segments: [{ text: "Hola" }], animate: false, audioManager: { playOutputCharacter: () => { sounds += 1; } }, onUpdate: (segments) => updates.push(segments[0].text) });
  await controller.promise;
  assert.deepEqual(updates, ["Hola"]);
  assert.equal(sounds, 0);
});

test("presentation policy preserves the audiovisual timing contract", () => {
  assert.deepEqual(presentationPolicy.sourceDelay, { player: 0, dice: 110, creature: 220, dm: 380, system: 380 });
  assert.equal(presentationPolicy.entranceDuration, 240);
  assert.equal(presentationPolicy.dwell, 90);
  assert.equal(presentationPolicy.characterDelay, 24);
  assert.equal(presentationPolicy.punctuationDelay, 65);
  assert.equal(presentationPolicy.diceInterval, 1000);
});

test("presentation preferences persist", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const preferences = createSoundPreferences({ storage });
  preferences.update({ soundEnabled: false, masterVolume: .4, textAnimationEnabled: false });
  const restored = createSoundPreferences({ storage });
  assert.deepEqual(restored.get(), { soundEnabled: false, masterVolume: .4, textAnimationEnabled: false });
});

test("presentation queue preserves order, ignores duplicates, and restores history silently", () => {
  const changes = [];
  const preferences = createSoundPreferences({ storage: null });
  const queue = createMessagePresentationQueue({ preferences, onChange: (records) => changes.push(records.map(({ id, phase }) => `${id}:${phase}`)) });
  queue.enqueue([{ id: "old", origin: "dm", segments: [{ text: "Old" }] }], { historical: true });
  queue.enqueue([{ id: "old", origin: "dm", segments: [{ text: "Old" }] }, { id: "new", origin: "player", text: "Paso", annotations: [], references: {} }]);
  assert.deepEqual(queue.snapshot().map(({ id, phase }) => [id, phase]), [["old", "complete"], ["new", "complete"]]);
  assert.ok(changes.length >= 2);
});

test("queue skip completes active typewriter without losing later messages", async () => {
  const timers = [];
  const scheduler = { setTimeout(callback, delay) { timers.push({ callback, delay }); return timers.length - 1; }, clearTimeout() {} };
  const queue = createMessagePresentationQueue({ scheduler, preferences: createSoundPreferences({ storage: null }), audioManager: { playOutputCharacter() {}, stop() {} } });
  queue.enqueue([{ id: "narrative", origin: "dm", segments: [{ text: "Narración larga." }] }, { id: "next", origin: "system", segments: [{ text: "Siguiente." }] }]);
  timers.shift().callback(); await Promise.resolve();
  timers.shift().callback(); await Promise.resolve();
  assert.equal(queue.activeMessageId, "narrative");
  assert.equal(queue.skip(), true);
  await Promise.resolve();
  assert.equal(queue.snapshot().find(({ id }) => id === "narrative").phase, "complete");
});

test("dice messages use one plural cue and do not typewrite", async () => {
  const timers = [];
  const dice = [];
  const scheduler = { setTimeout(callback, delay) { timers.push({ callback, delay }); return timers.length - 1; }, clearTimeout() {} };
  const queue = createMessagePresentationQueue({ scheduler, preferences: createSoundPreferences({ storage: null }), audioManager: { playDice: (multiple) => dice.push(multiple), playOutputCharacter() {} } });
  queue.enqueue([{ id: "roll", origin: "dice", type: "DICE_ROLLED", references: { roll: { kind: "DICE_ROLL", purpose: "DAMAGE", notation: "5d6", rolls: [1, 2, 3, 4, 5] } }, segments: [{ text: "5d6 = 15" }] }]);
  timers.shift().callback(); await Promise.resolve();
  assert.deepEqual(dice, [true]);
  assert.equal(queue.snapshot()[0].phase, "complete");
});
