import { toPublicError } from "../presenters/errorPresenter.js";

export async function withErrorHandler(response, handler) {
  try {
    await handler();
  } catch (error) {
    if (response.headersSent) return;
    sendJson(response, error.status ?? 500, { error: toPublicError(error) });
  }
}

export function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}
