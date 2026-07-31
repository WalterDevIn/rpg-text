import { createTypewriter } from "./typewriter.js";
import { diceInfo, isDiceMessage, presentationPolicy, sourceDelay } from "./messagePresentationPolicy.js";
import { isMultipleDice } from "./dicePresentation.js";
import { prefersReducedMotion } from "../../audio/soundPreferences.js";

export function createMessagePresentationQueue({ audioManager, preferences, scheduler = globalThis, now = () => Date.now(), onChange = () => {} } = {}) {
  const records = new Map();
  const order = [];
  let activeId = null;
  let activeController = null;
  let lastDiceAt = null;
  let stopped = false;
  const timers = new Set();
  const queue = {
    enqueue(messages = [], { historical = false } = {}) {
      for (const message of messages) {
        const id = stableId(message);
        if (records.has(id)) continue;
        const complete = historical || message.origin === "player";
        records.set(id, { ...message, id, announce: !historical, phase: complete ? "complete" : "pending", visibleSegments: complete ? message.segments : [] });
        order.push(id);
      }
      notify();
      process();
    },
    snapshot() { return order.map((id) => records.get(id)).filter(Boolean); },
    get activeMessageId() { return activeId; },
    get isActive() { return activeId !== null; },
    skip() {
      if (!activeController) return false;
      activeController.cancel({ complete: true });
      return true;
    },
    showPending() {
      if (activeController) activeController.cancel({ complete: true });
      for (const record of records.values()) if (record.phase !== "complete") complete(record);
      notify();
    },
    dispose() {
      stopped = true;
      activeController?.cancel();
      for (const timer of timers) scheduler.clearTimeout(timer);
      timers.clear();
      audioManager?.stop();
    },
  };
  return queue;

  async function process() {
    if (stopped || activeId !== null) return;
    const next = order.map((id) => records.get(id)).find((record) => record?.phase === "pending");
    if (!next) return;
    activeId = next.id;
    notify();
    if (isInitiative(next)) {
      const start = order.indexOf(next.id);
      const batch = [];
      for (let index = start; index < order.length; index += 1) {
        const record = records.get(order[index]);
        if (!record || record.phase !== "pending" || !isInitiative(record)) break;
        batch.push(record);
      }
      for (const record of batch) complete(record);
      audioManager?.playDice(true);
      activeId = null;
      notify();
      process();
      return;
    }
    await wait(sourceDelay(next));
    if (stopped || next.phase === "complete") return finishActive();
    if (isDiceMessage(next)) {
      next.phase = "visible";
      notify();
      const elapsed = lastDiceAt === null ? presentationPolicy.diceInterval : now() - lastDiceAt;
      if (lastDiceAt !== null && elapsed < presentationPolicy.diceInterval) await wait(presentationPolicy.diceInterval - elapsed);
      if (stopped || next.phase === "complete") return finishActive();
      lastDiceAt = now();
      audioManager?.playDice(isMultipleDice(next));
      complete(next);
      return finishActive();
    }
    next.phase = "visible";
    notify();
    await wait(reducedMotion() ? 1 : presentationPolicy.entranceDuration);
    if (stopped || next.phase === "complete") return finishActive();
    activeController = createTypewriter({ segments: next.segments ?? [{ text: next.text ?? "" }], audioManager, scheduler, animate: preferences?.get().textAnimationEnabled !== false, reducedMotion: reducedMotion(), onUpdate: (segments) => { next.visibleSegments = segments; notify(); } });
    await activeController.promise;
    activeController = null;
    if (next.phase !== "complete") complete(next);
    await wait(reducedMotion() ? 0 : presentationPolicy.dwell);
    finishActive();
  }

  function finishActive() { activeController = null; activeId = null; notify(); process(); }
  function complete(record) { record.phase = "complete"; record.visibleSegments = record.segments; }
  function reducedMotion() { return prefersReducedMotion() || Boolean(preferences?.get().reducedMotion); }
  function isInitiative(message) { return isDiceMessage(message) && diceInfo(message)?.purpose === "INITIATIVE"; }
  function wait(duration) {
    if (!duration) return Promise.resolve();
    return new Promise((resolve) => { const timer = scheduler.setTimeout(() => { timers.delete(timer); resolve(); }, duration); timers.add(timer); });
  }
  function notify() { onChange(queue.snapshot()); }
}

function stableId(message) { return String(message.id ?? message.sequence ?? `${message.type}:${message.text}`); }
