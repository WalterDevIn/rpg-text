import { spawn } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const children = [
  spawn(npm, ["run", "server"], { stdio: "inherit", env: { ...process.env, PORT: "3000" } }),
  spawn(npm, ["run", "client"], { stdio: "inherit", env: { ...process.env, PORT: "4173" } }),
];

let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const child of children) child.on("exit", (code) => {
  if (!stopping && code !== 0) process.exitCode = code ?? 1;
});
