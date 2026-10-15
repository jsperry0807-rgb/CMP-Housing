import { createApp } from "./app.js";
import { connectDatabase } from "./db.js";
import { env } from "./env.js";

async function main(): Promise<void> {
  await connectDatabase();

  createApp().listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

main().catch((error: unknown) => {
  console.error("Failed to start API:", error instanceof Error ? error.message : error);
  process.exit(1);
});
