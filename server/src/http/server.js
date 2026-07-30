import http from "node:http";
import {
  createCombatSession,
  getCombatEvents,
  getCombatSnapshot,
  listEncounterCharacters,
  listEncounterCreatures,
  listEncounterScenarios,
  submitCombatIntent,
  validateEncounterSetup,
} from "../application/index.js";

const port = Number(process.env.PORT ?? 3000);
const maxBodyBytes = 64 * 1024;
const allowedOrigins = new Set([
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "https://shiny-winner-g4qwrwp65g593vg7w-4173.app.github.dev",
  ...(process.env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? []),
]);

export function createApiServer() {
  return http.createServer(async (request, response) => {
    if (!setCorsHeaders(response, request)) {
      sendJson(response, 403, { error: { code: "CORS_ORIGIN_DENIED", message: "This development origin is not allowed.", details: [] } });
      return;
    }
    if (request.method === "OPTIONS") {
      response.writeHead(204).end();
      return;
    }

    try {
      await routeRequest(request, response);
    } catch (error) {
      const publicError = error.code ? error : { code: "INTERNAL_ERROR", message: "The server could not complete the request." };
      sendJson(response, publicError.status ?? 500, { error: toPublicError(publicError) });
    }
  });
}

async function routeRequest(request, response) {
  const path = new URL(request.url, "http://localhost").pathname.replace(/\/$/, "") || "/";
  if (path === "/api/health" && request.method === "GET") {
    sendJson(response, 200, { status: "ok" });
    return;
  }
  const exactMethods = {
    "/api/health": "GET",
    "/api/encounter/characters": "GET",
    "/api/encounter/creatures": "GET",
    "/api/encounter/scenarios": "GET",
    "/api/encounter/validate": "POST",
    "/api/combat-sessions": "POST",
  };
  if (exactMethods[path] && exactMethods[path] !== request.method) {
    return methodNotAllowed(response, exactMethods[path]);
  }
  if (path === "/api/encounter/characters" && request.method === "GET") {
    sendJson(response, 200, listEncounterCharacters());
    return;
  }
  if (path === "/api/encounter/creatures" && request.method === "GET") {
    sendJson(response, 200, listEncounterCreatures());
    return;
  }
  if (path === "/api/encounter/scenarios" && request.method === "GET") {
    sendJson(response, 200, listEncounterScenarios());
    return;
  }

  if (path === "/api/encounter/validate" && request.method === "POST") {
    const input = await readJson(request);
    assertEncounterShape(input);
    const result = validateEncounterSetup(input);
    if (result.ok) sendJson(response, 200, result);
    else sendJson(response, 422, { error: toValidationError(result.errors), ok: false, errors: result.errors });
    return;
  }

  if (path === "/api/combat-sessions" && request.method === "POST") {
    const input = await readJson(request);
    assertEncounterShape(input);
    const result = createCombatSession(input);
    if (result.ok) sendJson(response, 201, result);
    else sendJson(response, 422, { error: toValidationError(result.errors ?? [result.error]), ok: false });
    return;
  }

  const sessionMatch = path.match(/^\/api\/combat-sessions\/([^/]+)(?:\/(events|intents))?$/);
  if (sessionMatch) {
    const sessionId = decodeURIComponent(sessionMatch[1]);
    const resource = sessionMatch[2];
    if (!resource && request.method === "GET") {
      return sendSessionSnapshot(response, sessionId);
    }
    if (resource === "events" && request.method === "GET") {
      const since = Number(new URL(request.url, "http://localhost").searchParams.get("since") ?? 0);
      const result = getCombatEvents(sessionId, { since: Number.isFinite(since) ? since : 0 });
      if (!result.ok) return sendJson(response, 404, { error: toPublicError(result.error) });
      return sendJson(response, 200, result);
    }
    if (resource === "intents" && request.method === "POST") {
      const result = submitCombatIntent(sessionId, await readJson(request));
      if (!result.ok && result.error.code === "SESSION_NOT_FOUND") return sendJson(response, 404, { error: toPublicError(result.error) });
      if (!result.ok) return sendJson(response, 422, { error: toPublicError(result.error), snapshot: result.snapshot, events: result.events });
      return sendJson(response, 200, result);
    }
    return methodNotAllowed(response, resource === "events" ? "GET" : resource === "intents" ? "POST" : "GET");
  }

  if (path.startsWith("/api/") && ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    sendJson(response, 404, { error: { code: "NOT_FOUND", message: "API route not found.", details: [] } });
    return;
  }
  sendJson(response, 404, { error: { code: "NOT_FOUND", message: "Route not found.", details: [] } });
}

function methodNotAllowed(response, allowed) {
  response.setHeader("Allow", allowed);
  return sendJson(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "HTTP method is not supported for this route.", details: [] } });
}

function sendSessionSnapshot(response, sessionId) {
  const result = getCombatSnapshot(sessionId);
  if (!result.ok) return sendJson(response, 404, { error: toPublicError(result.error) });
  return sendJson(response, 200, result);
}

async function readJson(request) {
  const length = Number(request.headers["content-length"] ?? 0);
  if (length > maxBodyBytes) throw httpError(413, "PAYLOAD_TOO_LARGE", "Request body is too large.");
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > maxBodyBytes) throw httpError(413, "PAYLOAD_TOO_LARGE", "Request body is too large.");
  }
  if (!body) throw httpError(400, "MALFORMED_JSON", "A JSON request body is required.");
  try {
    const value = JSON.parse(body);
    if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("not an object");
    return value;
  } catch {
    throw httpError(400, "MALFORMED_JSON", "Request body must be valid JSON.");
  }
}

function assertEncounterShape(input) {
  if ("participants" in input || !Array.isArray(input.characterIds) || !Array.isArray(input.creatureIds) || !input.assignments || Array.isArray(input.assignments)) {
    throw httpError(400, "INVALID_REQUEST", "Encounter requests require characterIds, creatureIds, assignments, and scenarioId.");
  }
  if (input.scenarioId !== null && typeof input.scenarioId !== "string") {
    throw httpError(400, "INVALID_REQUEST", "scenarioId must be a string or null.");
  }
}

function httpError(status, code, message, details = []) {
  return Object.assign(new Error(message), { status, code, message, details });
}

function toValidationError(errors = []) {
  return {
    code: "INVALID_ENCOUNTER",
    message: "The encounter setup is invalid.",
    details: errors.map((error) => ({ field: "encounter", code: error.code, message: error.message })),
  };
}

function toPublicError(error) {
  return {
    code: error.code ?? "INTERNAL_ERROR",
    message: error.message ?? "The server could not complete the request.",
    details: error.details ?? [],
  };
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function setCorsHeaders(response, request) {
  const origin = request.headers.origin;
  if (origin && !allowedOrigins.has(origin)) return false;
  if (origin) response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Vary", "Origin");
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createApiServer();
  server.listen(port, "0.0.0.0", () => console.log(`RPG TEXT API available at http://localhost:${port}`));
}
