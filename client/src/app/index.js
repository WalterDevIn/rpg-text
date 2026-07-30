import { combatService } from "../services/combatService.js";

export function createAppShell(service = combatService) {
  return {
    title: "RPG TEXT",
    subtitle: "Narrative combat client",
    service,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createAppShell();
  console.log(`${app.title} - ${app.subtitle}`);
  console.log("Client shell ready. Combat actions are delegated to the server application.");
}
