import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { Aedes } from "aedes";
import net from "node:net";
import { WebSocketServer } from "ws";
import { createWebSocketStream } from "ws";

const recipeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["code", "name", "mixingTime", "minTemp", "maxTemp", "criticalTemp", "waterMl", "flourKg", "hydration", "notes", "steps"],
  properties: {
    code: { type: "string" },
    name: { type: "string" },
    mixingTime: { type: "number" },
    minTemp: { type: "number" },
    maxTemp: { type: "number" },
    criticalTemp: { type: "number" },
    waterMl: { type: "number" },
    flourKg: { type: "number" },
    hydration: { type: "number" },
    notes: { type: "string" },
    steps: { type: "array", items: { type: "string" } },
  },
};

export default defineConfig({
  plugins: [
    react(),
    {
      name: "senai-ai-recipe-api",
      configureServer(server) {
        server.middlewares.use("/api/ai/recipe", async (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: "Metodo nao permitido" }));
            return;
          }

          try {
            const body = await readJson(req);
            const apiKey = String(body.apiKey || process.env.OPENAI_API_KEY || "");
            if (!apiKey) {
              res.statusCode = 401;
              res.end(JSON.stringify({ error: "API Key nao informada" }));
              return;
            }

            const prompt = String(body.prompt || "massa de pao frances industrial");
            const batchKg = Number(body.batchKg || 25);
            const style = String(body.style || "panificacao industrial");
            const response = await fetch("https://api.openai.com/v1/responses", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: body.model || "gpt-5.2",
                input: [
                  {
                    role: "developer",
                    content:
                      "Voce e um tecnologo de panificacao industrial. Gere uma receita tecnicamente plausivel para amassadeira G.Paniz AE25G2 monitorada por sensor IR MLX90614. Responda somente JSON aderente ao schema.",
                  },
                  {
                    role: "user",
                    content: `Crie uma receita de massa para ${style}. Objetivo: ${prompt}. Batelada alvo: ${batchKg} kg. Use tempos em segundos, temperaturas em Celsius, agua em ml, farinha em kg e hidratacao em porcentagem. A faixa ideal deve ser segura para fermentacao e panificacao.`,
                  },
                ],
                text: {
                  format: {
                    type: "json_schema",
                    name: "bakery_recipe",
                    strict: true,
                    schema: recipeSchema,
                  },
                },
              }),
            });

            const data = await response.json();
            if (!response.ok) {
              res.statusCode = response.status;
              res.end(JSON.stringify({ error: data.error?.message || "Falha na OpenAI API" }));
              return;
            }

            const text = data.output_text || data.output?.flatMap((item: any) => item.content || []).find((part: any) => part.type === "output_text")?.text;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ recipe: JSON.parse(text) }));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }));
          }
        });
      },
    },
    {
      name: "senai-local-mqtt-broker",
      async configureServer() {
        await startMqttBroker();
      },
    },
  ],
  server: { host: "0.0.0.0", port: 5173 },
  preview: { host: "0.0.0.0", port: 4173 },
});

let mqttBrokerStarted = false;

async function startMqttBroker() {
  if (mqttBrokerStarted) return;
  mqttBrokerStarted = true;

  const broker = await Aedes.createBroker();
  const tcpServer = net.createServer((socket) => broker.handle(socket));
  tcpServer.listen(1883, "0.0.0.0", () => {
    console.log("[senai-mqtt] TCP broker listening on mqtt://0.0.0.0:1883");
  });

  const wsServer = new WebSocketServer({ port: 9001, host: "0.0.0.0" });
  wsServer.on("connection", (socket) => {
    const stream = createWebSocketStream(socket);
    broker.handle(stream);
  });
  wsServer.on("listening", () => {
    console.log("[senai-mqtt] WebSocket broker listening on ws://0.0.0.0:9001");
  });
}

function readJson(req: any) {
  return new Promise<any>((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk: Buffer) => {
      raw += chunk.toString();
      if (raw.length > 64_000) reject(new Error("Payload muito grande"));
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("JSON invalido"));
      }
    });
    req.on("error", reject);
  });
}
