import { sendJson } from "../middleware/errorHandler.js";
import { toPublicError, toValidationError } from "../presenters/errorPresenter.js";

export async function combatSessionRoutes(request, response, { application, readJson }) {
  const url = new URL(request.url, "http://localhost");
  const path = url.pathname.replace(/\/$/, "");
  if (path === "/api/combat-sessions" && request.method === "POST") {
    const input = await readJson(request);
    assertEncounterShape(input);
    const result = application.createCombatSession(input);
    return result.ok ? sendResult(response, 201, result) : sendJson(response, 422, { error: toValidationError(result.errors ?? [result.error]), ok: false });
  }
  const match = path.match(/^\/api\/combat-sessions\/([^/]+)(?:\/(events|intents|interpret|commands))?$/);
  if (!match) return false;
  const sessionId = decodeURIComponent(match[1]);
  if (!match[2] && request.method === "GET") return sessionResponse(response, application.getCombatSnapshot(sessionId));
  if (match[2] === "events" && request.method === "GET") return sessionResponse(response, application.getCombatEvents(sessionId, { since: Number.isFinite(Number(url.searchParams.get("since") ?? 0)) ? Number(url.searchParams.get("since") ?? 0) : 0 }));
  if (match[2] === "intents" && request.method === "POST") return intentResponse(response, application.submitCombatIntent(sessionId, await readJson(request)));
  if (match[2] === "interpret" && request.method === "POST") {
    const input = await readJson(request);
    assertCommandShape(input);
    const result = application.interpretCombatCommand(sessionId, input.text);
    return result.ok ? sendResult(response, 200, result.interpretation) : sendJson(response, 404, { error: toPublicError(result.error) });
  }
  if (match[2] === "commands" && request.method === "POST") {
    const input = await readJson(request);
    assertCommandShape(input);
    const result = application.executeCombatCommand(sessionId, input.text);
    if (result.ok) return sendResult(response, 200, result);
    if (result.error?.code === "SESSION_NOT_FOUND") return sendJson(response, 404, { error: toPublicError(result.error) });
    return sendJson(response, 422, { error: toPublicError(result.error), interpretation: result.interpretation, snapshot: result.snapshot, events: result.events });
  }
  return false;
}

function sessionResponse(response, result) { return result.ok ? sendResult(response, 200, result) : sendJson(response, 404, { error: toPublicError(result.error) }); }
function intentResponse(response, result) { if (result.ok) return sendResult(response, 200, result); if (result.error?.code === "SESSION_NOT_FOUND") return sendJson(response, 404, { error: toPublicError(result.error) }); return sendJson(response, 422, { error: toPublicError(result.error), snapshot: result.snapshot, events: result.events }); }
function sendResult(response, status, result) { sendJson(response, status, result); return true; }
function assertEncounterShape(input) { if ("participants" in input || !Array.isArray(input.characterIds) || !Array.isArray(input.creatureIds) || !input.assignments || Array.isArray(input.assignments)) throw Object.assign(new Error("Encounter requests require characterIds, creatureIds, assignments, and scenarioId."), { status: 400, code: "INVALID_REQUEST", details: [] }); if (input.scenarioId !== null && typeof input.scenarioId !== "string") throw Object.assign(new Error("scenarioId must be a string or null."), { status: 400, code: "INVALID_REQUEST", details: [] }); }
function assertCommandShape(input) { if (typeof input.text !== "string" || !input.text.trim()) throw Object.assign(new Error("Command requests require non-empty text."), { status: 400, code: "INVALID_REQUEST", details: [] }); }
