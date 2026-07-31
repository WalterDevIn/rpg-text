import { normalizeMobileApiBaseUrl } from "./urlNormalization.js";

export const HEALTH_TIMEOUT_MS = 10000;

export async function checkServerHealth(value, { fetchImpl = fetch, timeoutMs = HEALTH_TIMEOUT_MS, signal } = {}) {
  let baseUrl;
  try { baseUrl = normalizeMobileApiBaseUrl(value); } catch (error) { return { ok: false, diagnostic: invalidAddressDiagnostic(error) }; }
  const requestUrl = `${baseUrl}/api/health`;
  const startedAt = Date.now();
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  const abort = () => controller.abort();
  signal?.addEventListener?.("abort", abort, { once: true });
  try {
    const response = await fetchImpl(requestUrl, { method: "GET", signal: controller.signal });
    const contentType = response.headers?.get?.("content-type") ?? "";
    const rawBody = await response.text();
    const preview = sanitizePreview(rawBody);
    if (response.status >= 300 && response.status < 400 && isCodespaces(requestUrl)) return failure(`HTTP_${response.status}`, "Server authorization required", "The Codespaces port may be private. Set port 3000 to Public in the Codespaces Ports panel.", requestUrl, response.status, contentType, preview);
    if (response.status === 401 || response.status === 403) return failure(`HTTP_${response.status}`, "Server authorization required", isCodespaces(requestUrl) ? "The Codespaces port may be private. Set port 3000 to Public in the Codespaces Ports panel." : "The server requires authorization.", requestUrl, response.status, contentType, preview);
    if (response.status === 404) return failure("HTTP_404", "Health endpoint not found", `The server responded, but /api/health was not found. Requested URL: ${requestUrl}`, requestUrl, response.status, contentType, preview);
    if (response.status >= 500 && response.status <= 599) return failure("HTTP_5XX", "Server error", "The server reported an internal error.", requestUrl, response.status, contentType, preview);
    if (isHtml(contentType, rawBody)) return failure("HTML_RESPONSE", "Unexpected web page received", isCodespaces(requestUrl) ? "The address returned a web page instead of the RPG server API. The forwarded port may be private, or this may be the wrong port." : "The address returned a web page instead of the RPG server API.", requestUrl, response.status, contentType, preview);
    let data;
    try { data = JSON.parse(rawBody.replace(/^\uFEFF/, "")); } catch { return failure("INVALID_JSON", "Invalid server response", "The server responded, but the health response was not valid JSON.", requestUrl, response.status, contentType, preview); }
    if (!response.ok) return failure(`HTTP_${response.status}`, "Server error", data?.error?.message ?? "The server rejected the health check.", requestUrl, response.status, contentType, preview);
    if (data?.status !== "ok") return failure("INCOMPATIBLE_SERVER", "Incompatible server", "The server responded, but it is not compatible with this version of the mobile app.", requestUrl, response.status, contentType, preview);
    return { ok: true, latencyMs: Date.now() - startedAt, serverInfo: { status: data.status } };
  } catch (error) {
    if (signal?.aborted) return { ok: false, aborted: true };
    if (timedOut || error?.name === "AbortError") return failure("TIMEOUT", "Connection timed out", "The server did not respond in time.", requestUrl, 0, "", "");
    return failure("NETWORK_ERROR", "Server unreachable", isCodespaces(requestUrl) ? "The phone could not reach the configured server. Confirm that the Codespace is running and that port 3000 is Public." : "The phone could not reach the configured server.", requestUrl, 0, "", "");
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener?.("abort", abort);
  }
}

function failure(code, title, message, requestUrl, httpStatus, contentType, preview) { return { ok: false, diagnostic: { code, title, message, requestUrl, ...(httpStatus ? { httpStatus } : {}), ...(contentType ? { contentType } : {}), ...(preview ? { preview } : {}), retryable: true } }; }
function invalidAddressDiagnostic(error) { return { code: "INVALID_ADDRESS", title: "Invalid server address", message: error?.message === "Enter a valid server URL." ? "The address must begin with http:// or https://." : "The address must begin with http:// or https://.", retryable: false }; }
function isHtml(contentType, body) { return /text\/html/i.test(contentType) || /^\s*<(?:!doctype\s+html|html|head|body)\b/i.test(body); }
function sanitizePreview(body) { return String(body ?? "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300); }
function isCodespaces(url) { return url.includes(".app.github.dev"); }
