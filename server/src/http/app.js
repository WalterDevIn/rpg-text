import { createApplication } from "../application/createApplication.js";
import http from "node:http";
import { configuredOrigins, createCorsMiddleware } from "./middleware/cors.js";
import { createJsonBodyMiddleware } from "./middleware/jsonBody.js";
import { sendJson, withErrorHandler } from "./middleware/errorHandler.js";
import { healthRoutes } from "./routes/healthRoutes.js";
import { encounterRoutes } from "./routes/encounterRoutes.js";
import { combatSessionRoutes } from "./routes/combatSessionRoutes.js";

export function createApiServer({ application = createApplication() } = {}) {
  const cors = createCorsMiddleware({ allowedOrigins: configuredOrigins() });
  const readJson = createJsonBodyMiddleware();
  return http.createServer(async (request, response) => {
    if (!cors(request, response)) return sendJson(response, 403, { error: { code: "CORS_ORIGIN_DENIED", message: "This development origin is not allowed.", details: [] } });
    if (request.method === "OPTIONS") return response.writeHead(204).end();
    await withErrorHandler(response, async () => {
      const context = { application, readJson };
      if (await healthRoutes(request, response, context)) return;
      if (await encounterRoutes(request, response, context)) return;
      if (await combatSessionRoutes(request, response, context)) return;
      const path = new URL(request.url, "http://localhost").pathname;
      const allowedMethod = methodFor(path);
      if (allowedMethod && allowedMethod !== request.method) {
        response.setHeader("Allow", allowedMethod);
        return sendJson(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "HTTP method is not supported for this route.", details: [] } });
      }
      if (path.startsWith("/api/") && ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return sendJson(response, 404, { error: { code: "NOT_FOUND", message: "API route not found.", details: [] } });
      return sendJson(response, 404, { error: { code: "NOT_FOUND", message: "Route not found.", details: [] } });
    });
  });
}

function methodFor(path) {
  return {
    "/api/health": "GET",
    "/api/encounter/characters": "GET",
    "/api/encounter/creatures": "GET",
    "/api/encounter/scenarios": "GET",
    "/api/encounter/validate": "POST",
    "/api/combat-sessions": "POST",
  }[path] ?? (path.match(/^\/api\/combat-sessions\/[^/]+$/) ? "GET" : path.match(/^\/api\/combat-sessions\/[^/]+\/events$/) ? "GET" : path.match(/^\/api\/combat-sessions\/[^/]+\/(intents|interpret|commands)$/) ? "POST" : null);
}
