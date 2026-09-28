import { startServer } from "./index";
import { getIndexProcessor, getRedactProcessor } from "./application/processors/processorRegistry";

const server = startServer();
const shutdownTimeoutMs = 25_000;
let shuttingDown = false;

async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  // Bound shutdown even when a downstream request or HTTP connection hangs.
  const timeout = setTimeout(() => {
    console.error("Shutdown timed out; terminating remaining work.");
    process.exit(1);
  }, shutdownTimeoutMs);

  try {
    await Promise.all([
      getIndexProcessor().stopProcessing(),
      getRedactProcessor().stopProcessing(),
      new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
      }),
    ]);
    clearTimeout(timeout);
    process.exit(0);
  } catch (error) {
    clearTimeout(timeout);
    console.error("Shutdown failed:", error);
    process.exit(1);
  }
}

process.once("SIGTERM", () => { void shutdown(); });
process.once("SIGINT", () => { void shutdown(); });
