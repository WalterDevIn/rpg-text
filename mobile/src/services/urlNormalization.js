export function normalizeMobileApiBaseUrl(value) {
  const input = String(value ?? "").trim();
  if (!input) throw invalidUrl("Enter a valid server URL.");
  let parsed;
  try { parsed = new URL(input); } catch { throw invalidUrl("Enter a valid server URL."); }
  if (!/^https?:$/.test(parsed.protocol)) throw invalidUrl("Use an HTTP or HTTPS server URL.");
  return parsed.origin;
}

function invalidUrl(message) { const error = new Error(message); error.code = "INVALID_SERVER_URL"; return error; }
