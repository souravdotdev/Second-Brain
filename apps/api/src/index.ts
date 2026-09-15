import Fastify from "fastify";
import cors from "@fastify/cors";
import { itemRoutes } from "./routes/items";
import { dependencies } from "./composition";
import { env } from "./env";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(itemRoutes(dependencies));

app.get("/health", async () => ({ status: "ok" }));

app.listen({ port: env.PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
