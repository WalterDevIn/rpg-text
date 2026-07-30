import { sendJson } from "../middleware/errorHandler.js";

export async function healthRoutes(request, response) {
  const path = new URL(request.url, "http://localhost").pathname.replace(/\/$/, "");
  if (path !== "/api/health" || request.method !== "GET") return false;
  sendJson(response, 200, { status: "ok" });
  return true;
}
