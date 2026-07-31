import { sendJson } from "../middleware/errorHandler.js";
import { toPublicError, toValidationError } from "../presenters/errorPresenter.js";

export async function encounterRoutes(request, response, { application, readJson }) {
  const path = new URL(request.url, "http://localhost").pathname.replace(/\/$/, "");
  if (path === "/api/encounter/characters" && request.method === "GET") return sendResult(response, 200, application.listEncounterCharacters());
  if (path === "/api/encounter/creatures" && request.method === "GET") return sendResult(response, 200, application.listEncounterCreatures());
  if (path === "/api/encounter/scenarios" && request.method === "GET") return sendResult(response, 200, application.listEncounterScenarios());
  if (path === "/api/encounter/validate" && request.method === "POST") {
    const input = await readJson(request);
    assertEncounterShape(input);
    const result = application.validateEncounterSetup(input);
    return result.ok ? sendResult(response, 200, result) : sendJson(response, 422, { error: toValidationError(result.errors), ok: false, errors: result.errors });
  }
  return false;
}

function sendResult(response, status, result) { sendJson(response, status, result); return true; }

function assertEncounterShape(input) {
  if (Array.isArray(input.participants)) return assertStructuredParticipantShape(input);
  if (!Array.isArray(input.characterIds) || !Array.isArray(input.creatureIds) || !input.assignments || Array.isArray(input.assignments)) throw Object.assign(new Error("Encounter requests require characterIds, creatureIds, assignments, and scenarioId."), { status: 400, code: "INVALID_REQUEST", details: [] });
  if (input.scenarioId !== null && typeof input.scenarioId !== "string") throw Object.assign(new Error("scenarioId must be a string or null."), { status: 400, code: "INVALID_REQUEST", details: [] });
}

function assertStructuredParticipantShape(input) {
  if (input.participants.some((participant) => !participant || typeof participant !== "object" || typeof participant.instanceKey !== "string" || typeof participant.sourceId !== "string" || typeof participant.participantKind !== "string" || typeof participant.side !== "string" || typeof participant.controller !== "string")) throw Object.assign(new Error("Structured participants require instanceKey, sourceId, participantKind, side, and controller."), { status: 400, code: "INVALID_REQUEST", details: [] });
  if (input.scenarioId !== null && typeof input.scenarioId !== "string") throw Object.assign(new Error("scenarioId must be a string or null."), { status: 400, code: "INVALID_REQUEST", details: [] });
}
