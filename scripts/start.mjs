import { spawn } from "node:child_process";
const role = process.env.APP_ROLE || "site";
const commands = {
  api: ["apps/api/dist/main.js"],
  panel: ["scripts/serve-panel.mjs"],
  site: [
    "node_modules/next/dist/bin/next",
    "start",
    "apps/site",
    "--hostname",
    "0.0.0.0",
    "--port",
    process.env.PORT || "80",
  ],
};
if (!commands[role]) throw new Error("APP_ROLE must be api, panel or site");
const child = spawn(process.execPath, commands[role], {
  stdio: "inherit",
  env: process.env,
});
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
