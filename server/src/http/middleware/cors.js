const defaultOrigins = new Set([
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "https://shiny-winner-g4qwrwp65g593vg7w-4173.app.github.dev",
]);

export function createCorsMiddleware({ allowedOrigins = defaultOrigins } = {}) {
  return (request, response) => {
    const origin = request.headers.origin;
    if (origin && !allowedOrigins.has(origin)) return false;
    if (origin) response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    response.setHeader("Vary", "Origin");
    return true;
  };
}

export function configuredOrigins() {
  return new Set([...defaultOrigins, ...(process.env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [])]);
}
