import Fastify from "fastify";
import cors from "@fastify/cors";
import { itemRoutes } from "./routes/items";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(itemRoutes);

app.get("/health", async () => ({ status: "ok" }));

const port = Number(process.env.PORT ?? 4000);

app
  .listen({ port, host: "0.0.0.0" })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
