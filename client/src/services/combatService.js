import { getApiBaseUrl, getApiCandidates, normalizeApiBaseUrl, setStoredApiBaseUrl, clearStoredApiBaseUrl } from "./apiConfig.js";

export class HttpApplicationError extends Error {
  constructor({ status = 0, code = "NETWORK_ERROR", message = "The server is unavailable.", details = [], data = null } = {}) {
    super(message);
    this.name = "HttpApplicationError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.data = data;
  }
}

export { getApiBaseUrl, normalizeApiBaseUrl, setStoredApiBaseUrl, clearStoredApiBaseUrl };

export async function getHealth(baseUrl) {
  return request("/health", { baseUrl });
}

export async function listEncounterCharacters() {
  return request("/encounter/characters");
}

export async function listEncounterCreatures() {
  return request("/encounter/creatures");
}

export async function listEncounterScenarios() {
  return request("/encounter/scenarios");
}

export async function validateEncounterSetup(input) {
  try {
    return await request("/encounter/validate", { method: "POST", body: input });
  } catch (error) {
    return { ok: false, errors: error.details.length ? error.details : [toClientError(error)] };
  }
}

export function createCombatSession(input) {
  return request("/combat-sessions", { method: "POST", body: input });
}

export function getCombatSession(sessionId) {
  return request(`/combat-sessions/${encodeURIComponent(sessionId)}`);
}

export function getCombatEvents(sessionId, { since = 0 } = {}) {
  return request(`/combat-sessions/${encodeURIComponent(sessionId)}/events?since=${encodeURIComponent(since)}`);
}

export function submitCombatIntent(sessionId, intent) {
  return request(`/combat-sessions/${encodeURIComponent(sessionId)}/intents`, { method: "POST", body: intent });
}

export function interpretCombatCommand(sessionId, text) {
  return request(`/combat-sessions/${encodeURIComponent(sessionId)}/interpret`, { method: "POST", body: { text } });
}

export function executeCombatCommand(sessionId, text) {
  return request(`/combat-sessions/${encodeURIComponent(sessionId)}/commands`, { method: "POST", body: { text } });
}

export const combatService = Object.freeze({
  getHealth,
  listEncounterCharacters,
  listEncounterCreatures,
  listEncounterScenarios,
  validateEncounterSetup,
  createCombatSession,
  getCombatSession,
  getCombatEvents,
  submitCombatIntent,
  interpretCombatCommand,
  executeCombatCommand,
});

async function request(path, { method = "GET", body, baseUrl } = {}) {
  const candidates = baseUrl ? [normalizeApiBaseUrl(baseUrl)] : getApiCandidates();
  let lastError;
  for (const candidate of candidates) {
    try {
      return await requestBase(candidate, path, { method, body });
    } catch (error) {
      lastError = error;
      if (error.status !== 0 || candidate !== candidates[0]) throw error;
    }
  }
  throw lastError;
}

async function requestBase(baseUrl, path, { method, body }) {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new HttpApplicationError({ message: "The server is unavailable. Check that the API is running." });
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new HttpApplicationError({ status: response.status, code: "INVALID_RESPONSE", message: "The server returned an invalid response." });
  }
  if (!response.ok) {
    const unavailable = response.status === 502 || response.status === 503;
    throw new HttpApplicationError({
      status: unavailable ? 0 : response.status,
      code: unavailable ? "NETWORK_ERROR" : payload.error?.code ?? "HTTP_ERROR",
      message: payload.error?.message ?? "The server rejected the request.",
      details: payload.error?.details ?? [],
      data: payload,
    });
  }
  return payload;
}

function toClientError(error) {
  return { field: "connection", code: error.code, message: error.message };
}
