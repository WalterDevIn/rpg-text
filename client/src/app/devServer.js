import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const workspace = resolve(fileURLToPath(new URL("../../", import.meta.url)));
const projectRoot = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const port = Number(process.env.PORT ?? 4173);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};
const apiTarget = process.env.API_TARGET ?? "http://127.0.0.1:3000";

const server = http.createServer(async (request, response) => {
  if (request.url?.startsWith("/api")) {
    await proxyApi(request, response);
    return;
  }
  const requested = request.url === "/" ? "/public/index.html" : request.url.split("?")[0];
  const sharedRequest = requested.startsWith("/shared/");
  const base = sharedRequest ? resolve(projectRoot, "shared") : workspace;
  const relativePath = sharedRequest ? requested.slice("/shared".length) : requested;
  const filePath = resolve(base, `.${relativePath}`);
  if (!filePath.startsWith(`${base}${sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const content = await readFile(filePath);
    response.writeHead(200, { "Content-Type": types[extname(filePath)] ?? "application/octet-stream" }).end(content);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

async function proxyApi(request, response) {
  try {
    const body = ["GET", "HEAD"].includes(request.method) ? undefined : await readRequestBody(request);
    const upstream = await fetch(`${apiTarget}${request.url}`, {
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

server.listen(port, "0.0.0.0", () => {
  console.log(`RPG TEXT client available at http://localhost:${port}`);
});
