const storageKey = "rpg-text.api-base-url";
export const codespacesApiBaseUrl = "https://shiny-winner-g4qwrwp65g593vg7w-3000.app.github.dev";

export function normalizeApiBaseUrl(value, origin = globalThis.location?.origin) {
  const input = String(value ?? "").trim();
  if (!input) return "/api";
  if (input.startsWith("/")) {
    const pathname = input.replace(/\/+$/, "");
    return pathname === "/api" || pathname.endsWith("/api") ? pathname : `${pathname}/api`;
  }
  const parsed = new URL(input);
  const pathname = parsed.pathname.replace(/\/+$/, "");
  const apiPath = pathname === "/api" || pathname.endsWith("/api") ? pathname : `${pathname}/api`;
  return `${parsed.origin}${apiPath || "/api"}`;
}

export function getStoredApiBaseUrl() {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

export function setStoredApiBaseUrl(value) {
  const normalized = normalizeApiBaseUrl(value);
  if (normalized === "/api") return clearStoredApiBaseUrl();
  localStorage.setItem(storageKey, normalized);
  return normalized;
}

export function clearStoredApiBaseUrl() {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
  return "/api";
}

export function getApiBaseUrl() {
  const stored = getStoredApiBaseUrl();
  if (stored) return normalizeApiBaseUrl(stored);
  const environment = globalThis.RPG_TEXT_API_BASE_URL;
  return environment ? normalizeApiBaseUrl(environment) : "/api";
}

export function getApiCandidates() {
  const current = getApiBaseUrl();
  return current === "/api" ? ["/api", codespacesApiBaseUrl + "/api"] : [current];
}
