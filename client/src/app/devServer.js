import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT ?? 4173);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
};
const apiTarget = process.env.API_TARGET ?? "http://127.0.0.1:3000";

export function createClientServer({ apiTarget: target = apiTarget } = {}) {
  const workspace = resolve(fileURLToPath(new URL("../../", import.meta.url)));
  const projectRoot = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
  const roots = {
    public: resolve(workspace, "public"),
    source: resolve(workspace, "src"),
    shared: resolve(projectRoot, "shared"),
  };

  return http.createServer(async (request, response) => {
    const rawPath = (request.url ?? "/").split("?", 1)[0];
    if (hasTraversal(rawPath)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const url = new URL(request.url ?? "/", "http://localhost");
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      await proxyApi(request, response, target);
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      response.writeHead(403).end("Forbidden");
      return;
    }

    const route = resolvePublicRoute(pathname, roots);
    if (route.unsafe) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    if (!route.filePath) {
      response.writeHead(404).end("Not found");
      return;
    }
    try {
      const content = await readFile(route.filePath);
      response.writeHead(200, { "Content-Type": types[extname(route.filePath).toLowerCase()] ?? "application/octet-stream" }).end(content);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
}

function hasTraversal(rawPath) {
  return /%2e|%5c/i.test(rawPath) || rawPath.split("/").some((part) => part === "." || part === "..");
}

function resolvePublicRoute(pathname, roots) {
  if (pathname === "/") return safePath(roots.public, "/index.html");
  if (pathname.startsWith("/shared/")) return safePath(roots.shared, pathname.slice("/shared".length));
  if (pathname.startsWith("/src/")) return safePath(roots.source, pathname.slice("/src".length));
  return safePath(roots.public, pathname);
}

function safePath(root, relativePath) {
  const filePath = resolve(root, `.${relativePath}`);
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) return { unsafe: true };
  return { filePath };
}

async function proxyApi(request, response, target) {
  try {
    const body = ["GET", "HEAD"].includes(request.method) ? undefined : await readRequestBody(request);
    const upstream = await fetch(`${target}${request.url}`, {
      method: request.method,
      headers: { "Content-Type": request.headers["content-type"] ?? "" },
      body,
    });
    const content = Buffer.from(await upstream.arrayBuffer());
    response.writeHead(upstream.status, { "Content-Type": upstream.headers.get("content-type") ?? "application/json; charset=utf-8" }).end(content);
  } catch {
    response.writeHead(502, { "Content-Type": "application/json; charset=utf-8" }).end(JSON.stringify({ error: { code: "API_UNAVAILABLE", message: "The backend API is unavailable.", details: [] } }));
  }
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createClientServer();
  server.listen(port, "0.0.0.0", () => {
    console.log(`RPG TEXT client available at http://localhost:${port}`);
  });
}
