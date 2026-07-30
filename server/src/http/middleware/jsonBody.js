import http from "node:http";

export function createJsonBodyMiddleware({ maxBodyBytes = 64 * 1024 } = {}) {
  return async function readJson(request) {
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
  };
}

function httpError(status, code, message, details = []) {
  return Object.assign(new Error(message), { status, code, message, details });
}
