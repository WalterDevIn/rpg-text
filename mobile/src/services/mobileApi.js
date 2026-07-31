import { checkServerHealth } from "./healthCheck.js";
import { normalizeMobileApiBaseUrl } from "./urlNormalization.js";

export { normalizeMobileApiBaseUrl } from "./urlNormalization.js";

export class MobileApiError extends Error {
  constructor({ status = 0, code = "NETWORK_ERROR", message = "The server is unavailable.", details = [], data = null } = {}) {
    super(message);
    this.name = "MobileApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.data = data;
  }
}

export function createMobileApi(baseUrl, { fetchImpl = fetch } = {}) {
  const normalizedBaseUrl = normalizeMobileApiBaseUrl(baseUrl);
  return Object.freeze({
    baseUrl: normalizedBaseUrl,
    getHealth: (options) => checkServerHealth(normalizedBaseUrl, { ...options, fetchImpl }),
    listEncounterCharacters: (options) => request("/encounter/characters", { ...options, fetchImpl, baseUrl: normalizedBaseUrl }),
    listEncounterCreatures: (options) => request("/encounter/creatures", { ...options, fetchImpl, baseUrl: normalizedBaseUrl }),
    listEncounterScenarios: (options) => request("/encounter/scenarios", { ...options, fetchImpl, baseUrl: normalizedBaseUrl }),
    validateEncounterSetup: (input, options) => validateSetup(input, { ...options, fetchImpl, baseUrl: normalizedBaseUrl }),
    createCombatSession: (input, options) => request("/combat-sessions", { method: "POST", body: input, ...options, fetchImpl, baseUrl: normalizedBaseUrl }),
    getCombatSession: (sessionId, options) => request(`/combat-sessions/${encodeURIComponent(sessionId)}`, { ...options, fetchImpl, baseUrl: normalizedBaseUrl }),
    getCombatEvents: (sessionId, { since = 0, ...options } = {}) => request(`/combat-sessions/${encodeURIComponent(sessionId)}/events?since=${encodeURIComponent(since)}`, { ...options, fetchImpl, baseUrl: normalizedBaseUrl }),
    interpretCombatCommand: (sessionId, text, options) => request(`/combat-sessions/${encodeURIComponent(sessionId)}/interpret`, { method: "POST", body: { text }, ...options, fetchImpl, baseUrl: normalizedBaseUrl }),
    executeCombatCommand: (sessionId, text, options) => request(`/combat-sessions/${encodeURIComponent(sessionId)}/commands`, { method: "POST", body: { text }, ...options, fetchImpl, baseUrl: normalizedBaseUrl }),
  });
}

async function validateSetup(input, options) {
  try { return await request("/encounter/validate", { method: "POST", body: input, ...options }); }
  catch (error) {
    if (error instanceof MobileApiError && error.status === 422) return { ok: false, errors: error.details.length ? error.details : [{ field: "connection", code: error.code, message: error.message }] };
    throw error;
  }
}

async function request(path, { baseUrl, method = "GET", body, signal, fetchImpl }) {
  let response;
  try {
    response = await fetchImpl(`${baseUrl}/api${path}`, { method, signal, headers: body === undefined ? {} : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new MobileApiError({ message: "The server is unavailable. Check the configured URL." });
  }
  let data;
  let rawBody;
  try { rawBody = await response.text(); data = JSON.parse(rawBody.replace(/^\uFEFF/, "")); } catch {
    const preview = String(rawBody ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
    throw new MobileApiError({ status: response.status, code: "INVALID_RESPONSE", message: `The server returned an invalid response${preview ? `: ${preview}` : "."}`, data: rawBody });
  }
  if (!response.ok) throw new MobileApiError({ status: response.status, code: data.error?.code ?? "HTTP_ERROR", message: data.error?.message ?? "The server rejected the request.", details: data.error?.details ?? [], data });
  return data;
}
