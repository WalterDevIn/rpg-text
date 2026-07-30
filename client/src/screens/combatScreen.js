import { ConnectionSettings } from "../components/connectionSettings.js";
import { CombatChat } from "../components/combatChat.js";
import { ParticipantPanel } from "../components/participantPanel.js";
import { ActionComposer } from "../components/actionComposer.js";
import { presentCombatEvent } from "../services/eventPresenter.js";

export function CombatScreen({ root, service, sessionId, snapshot, events, scenario, onReturn }) {
  let state = {
    snapshot,
    messages: toMessages(events, snapshot),
    eventCursor: maxSequence(events),
    pending: false,
    error: null,
    connectionStatus: "connected",
  };

  function appendEvents(nextEvents) {
    const existing = new Set(state.messages.map((message) => message.sequence));
    const additions = nextEvents
      .filter((event) => !existing.has(event.sequence))
      .sort((left, right) => left.sequence - right.sequence)
      .map((event) => presentCombatEvent(event, state.snapshot.participants));
    state = { ...state, messages: [...state.messages, ...additions], eventCursor: Math.max(state.eventCursor, maxSequence(nextEvents)) };
  }

  async function submitIntent(intent) {
    state = { ...state, pending: true, error: null };
    render();
    try {
      const result = await service.submitCombatIntent(sessionId, intent);
      if (result.snapshot) state = { ...state, snapshot: result.snapshot };
      appendEvents(result.events ?? []);
      state = { ...state, pending: false, connectionStatus: "connected" };
    } catch (error) {
      if (error.data?.snapshot) state = { ...state, snapshot: error.data.snapshot };
      appendEvents(error.data?.events ?? []);
      state = { ...state, pending: false, error, connectionStatus: error.code === "NETWORK_ERROR" ? "unavailable" : state.connectionStatus };
    }
    render();
  }

  async function reconnect() {
    state = { ...state, connectionStatus: "connecting", error: null };
    render();
    try {
      const session = await service.getCombatSession(sessionId);
      const newEvents = await service.getCombatEvents(sessionId, { since: state.eventCursor });
      state = { ...state, snapshot: session.snapshot, connectionStatus: "connected", error: null };
      appendEvents(newEvents.events ?? []);
    } catch (error) {
      state = { ...state, connectionStatus: "unavailable", error };
    }
    render();
  }

  function render() {
    const previousViewport = root.querySelector(".chat-viewport");
    const previousScrollTop = previousViewport?.scrollTop ?? 0;
    const previousDistance = previousViewport ? previousViewport.scrollHeight - previousViewport.scrollTop - previousViewport.clientHeight : 0;
    root.replaceChildren();
    const stage = document.createElement("main");
    stage.className = "app-stage combat-stage";
    const active = state.snapshot.participants.find((participant) => participant.entityId === state.snapshot.activeEntityId);
    stage.innerHTML = `<header class="combat-header"><div><div class="eyebrow">RPG TEXT / LIVE COMBAT</div><h1>${scenario?.name ?? "Encounter"}</h1></div><div class="combat-meta"><span>ROUND ${state.snapshot.round}</span><span>${state.snapshot.status}</span><span>ACTIVE: ${active?.identity.name ?? "NONE"}</span></div></header>`;
    stage.append(ConnectionSettings({ service, status: state.connectionStatus, onRetry: reconnect }));

    const layout = document.createElement("div");
    layout.className = "combat-layout";
    layout.append(CombatChat({ messages: state.messages, autoScroll: !previousViewport || previousDistance < 80, scrollTop: previousScrollTop }));
    const rail = document.createElement("aside");
    rail.className = "combat-rail";
    rail.append(ParticipantPanel({ participants: state.snapshot.participants, activeEntityId: state.snapshot.activeEntityId }));
    rail.append(ActionComposer({ snapshot: state.snapshot, onSubmit: submitIntent, pending: state.pending, error: state.error }));
    if (state.snapshot.status === "FINISHED") rail.append(renderResult());
    if (state.error && state.connectionStatus === "unavailable") rail.append(renderConnectionNotice());
    layout.append(rail);
    stage.append(layout);
    root.append(stage);
  }

  function renderResult() {
    const result = document.createElement("section");
    result.className = "combat-result";
    const finish = [...state.messages].reverse().find((message) => message.type === "COMBAT_FINISHED");
    result.innerHTML = `<div class="section-kicker">FINAL RESULT</div><h2>Encounter resolved</h2><p>${finish?.text ?? "The combat has ended."}</p><button type="button" class="start-combat-button">Return to encounter setup</button>`;
    result.querySelector("button").addEventListener("click", onReturn);
    return result;
  }

  function renderConnectionNotice() {
    const notice = document.createElement("p");
    notice.className = "action-error";
    notice.textContent = "Server unavailable. Your session and chat are preserved. Use Server connection above to retry.";
    return notice;
  }

  render();
  return { getState: () => state };
}

function toMessages(events, snapshot) {
  return [...events].sort((left, right) => left.sequence - right.sequence).map((event) => presentCombatEvent(event, snapshot.participants));
}

function maxSequence(events) {
  return events.reduce((max, event) => Math.max(max, event.sequence ?? 0), 0);
}
