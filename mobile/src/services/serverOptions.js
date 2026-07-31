export const predefinedServers = Object.freeze([
  Object.freeze({
    id: "codespaces-development",
    label: "Codespaces Development",
    address: "https://shiny-winner-g4qwrwp65g593vg7w-3000.app.github.dev",
  }),
]);

export function isCodespacesServer(address) {
  return String(address ?? "").includes("shiny-winner-g4qwrwp65g593vg7w-3000.app.github.dev");
}
