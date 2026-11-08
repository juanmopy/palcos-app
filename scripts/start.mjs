import { spawn } from "node:child_process";

const port = process.env.PORT ?? "3000";
const next = spawn("next", ["start", "-p", port], {
  stdio: "inherit",
});

next.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});
