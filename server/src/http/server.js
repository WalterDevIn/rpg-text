import { createApiServer } from "./app.js";

export { createApiServer } from "./app.js";

const port = Number(process.env.PORT ?? 3000);

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createApiServer();
  server.listen(port, "0.0.0.0", () => console.log(`RPG TEXT API available at http://localhost:${port}`));
}
