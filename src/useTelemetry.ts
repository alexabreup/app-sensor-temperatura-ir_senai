import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import mqtt, { MqttClient } from "mqtt";
import { AppConfig, defaultConfig, normalizeTelemetry, RecipeState, TelemetrySample, Recipe, CycleStatus } from "./domain";
import { saveTelemetryInSqlite } from "./db";

const STORAGE_KEY = "senai-ir-hmi-config";
const MAX_HISTORY = 90;

export function useTelemetry(activeRecipe: Recipe) {
  const [config, setConfig] = useState<AppConfig>(() => loadConfig());
  const [samples, setSamples] = useState<TelemetrySample[]>([]);
  const [connection, setConnection] = useState("Inicializando");
  const [commandStatus, setCommandStatus] = useState("Sem comandos enviados");
  
  // Local cycle control state (especially for Simulator, and synced with operations)
  const [cycleStatus, setCycleStatus] = useState<CycleStatus>("idle");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [simTemp, setSimTemp] = useState(21.5);

  const clientRef = useRef<MqttClient | null>(null);

  // Default fallback sample when history is empty
  const defaultSample = useMemo((): TelemetrySample => {
    return {
      ts: Date.now(),
      deviceId: "amassadeira_S3_SIM",
      temp: simTemp,
      ambientTemp: 24.2,
      rawTemp: simTemp - 0.35,
      correctedTemp: simTemp - 0.08,
      state: 0,
      timeRemaining: activeRecipe.mixingTime - elapsedTime,
      elapsedTime,
      message: "Aguardando",
      valid: true,
      source: "simulator",
    };
  }, [simTemp, elapsedTime, activeRecipe.mixingTime]);

  const latest = samples[samples.length - 1] ?? defaultSample;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  // Simulation loop effect
  useEffect(() => {
    if (config.mode !== "simulator") return;

    setConnection("Simulador local");
    const timer = window.setInterval(() => {
      setElapsedTime((prevElapsed) => {
        let nextElapsed = prevElapsed;
        let currentStatus = cycleStatus;

        if (cycleStatus === "running") {
          nextElapsed = prevElapsed + 1;
          if (nextElapsed >= activeRecipe.mixingTime) {
            nextElapsed = activeRecipe.mixingTime;
            setCycleStatus("idle");
            currentStatus = "idle";
          }
        }

        // Calculate simulated temperature
        let nextTemp = simTemp;
        if (currentStatus === "running") {
          const fraction = nextElapsed / activeRecipe.mixingTime;
          // Slowly heats from 21.5C towards and beyond maxTemp
          const targetDelta = activeRecipe.criticalTemp - 21.5 + 1.2;
          nextTemp = 21.5 + fraction * targetDelta + Math.sin(nextElapsed / 8) * 0.4;
        } else if (currentStatus === "paused") {
          // Temperature stays relatively stable
          nextTemp = simTemp + (Math.random() - 0.5) * 0.08;
        } else {
          // Idle or emergency: Cool down slowly to room temperature (24.2C)
          const ambient = 24.2;
          nextTemp = simTemp + (ambient - simTemp) * 0.02;
        }
        setSimTemp(nextTemp);

        // Determine state according to business rules
        let state: RecipeState = 0; // Aguardando
        if (currentStatus === "emergency") {
          state = 3; // Critical/Emergency state
        } else if (nextElapsed >= activeRecipe.mixingTime) {
          state = 4; // Finalizado
        } else if (nextTemp >= activeRecipe.criticalTemp) {
          state = 3; // Critical
        } else if (nextTemp >= activeRecipe.maxTemp) {
          state = 2; // Adicionar água gelada
        } else if (nextTemp >= activeRecipe.minTemp) {
          state = 1; // Temperatura OK
        }

        const timeRemaining = Math.max(0, activeRecipe.mixingTime - nextElapsed);
        let message = "Aguardando";
        if (currentStatus === "emergency") {
          message = "EMERGÊNCIA ATIVADA!";
        } else if (state === 4) {
          message = "PROCESSO FINALIZADO!";
        } else if (state === 3) {
          message = "ALERTA: TEMP CRITICA!";
        } else if (state === 2) {
          message = "Adicionar agua gelada";
        } else if (state === 1) {
          message = "Temperatura OK";
        } else if (currentStatus === "running") {
          message = "Misturando...";
        }

        const sample: TelemetrySample = {
          ts: Date.now(),
          deviceId: "amassadeira_S3_SIM",
          temp: nextTemp,
          ambientTemp: 24.2 + Math.sin(nextElapsed / 15) * 0.4,
          rawTemp: nextTemp - 0.35,
          correctedTemp: nextTemp - 0.08,
          state,
          timeRemaining,
          elapsedTime: nextElapsed,
          message,
          valid: true,
          source: "simulator",
        };

        if (currentStatus === "running") {
          saveTelemetryInSqlite(sample).catch((err) => console.error("SQLite telemetry log error:", err));
        }

        pushSample(setSamples, sample);
        return nextElapsed;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [config.mode, cycleStatus, activeRecipe, simTemp]);

  // MQTT Connection effect
  useEffect(() => {
    if (config.mode !== "mqtt") return;

    let client: MqttClient | undefined;
    clientRef.current = null;
    setConnection("Conectando ao broker");
    try {
      client = mqtt.connect(config.brokerUrl, {
        clientId: config.clientId,
        clean: true,
        reconnectPeriod: 2500,
        connectTimeout: 8000,
      });
      const telemetryTopic = `amassadeira/${config.deviceFilter || "+"}/telemetry`;
      const statusTopic = `amassadeira/${config.deviceFilter || "+"}/status`;

      client.on("connect", () => {
        clientRef.current = client ?? null;
        setConnection("MQTT conectado");
        client?.subscribe([telemetryTopic, statusTopic], { qos: 1 });
      });
      client.on("reconnect", () => {
        clientRef.current = null;
        setConnection("Reconectando MQTT");
      });
      client.on("close", () => {
        clientRef.current = null;
        setConnection("MQTT desconectado");
      });
      client.on("error", (err) => setConnection(`Erro MQTT: ${err.message}`));
      client.on("message", (topic, message) => {
        if (topic.endsWith("/status")) {
          setConnection(`Dispositivo ${message.toString()}`);
          return;
        }
        try {
          const sample = normalizeTelemetry(topic, message.toString(), "mqtt");
          pushSample(setSamples, sample);
          if (sample.elapsedTime !== undefined) {
            setElapsedTime(sample.elapsedTime);
          }
          // Infer cycle status from received MQTT telemetry state
          if (sample.state === 4) {
            setCycleStatus("idle");
          } else if (sample.state > 0 && sample.state < 4) {
            setCycleStatus("running");
            saveTelemetryInSqlite(sample).catch((err) => console.error("SQLite telemetry log error:", err));
          }
        } catch (error) {
          setConnection(`Payload invalido: ${(error as Error).message}`);
        }
      });
    } catch (error) {
      setConnection(`Falha MQTT: ${(error as Error).message}`);
    }

    return () => {
      clientRef.current = null;
      client?.end(true);
    };
  }, [config]);

  const metrics = useMemo(() => {
    const last30 = samples.slice(-30);
    const avg = last30.reduce((sum, item) => sum + item.temp, 0) / (last30.length || 1);
    const peak = Math.max(...last30.map((item) => item.temp), latest.temp);
    const trend = last30.length > 3 ? latest.temp - last30[0].temp : 0;
    return { avg, peak, trend };
  }, [latest.temp, samples]);

  async function publishCalibration(offsetC: number, deviceId: string) {
    return publishCommand("calibrate", { offset_c: Number(offsetC.toFixed(2)) }, deviceId);
  }

  async function publishCommand(command: string, data: Record<string, unknown>, deviceId: string) {
    const client = clientRef.current;
    const payload = JSON.stringify(data);

    if (config.mode !== "mqtt" || !client?.connected) {
      setCommandStatus(`Simulado/local: ${command} ${payload}`);
      return config.mode === "simulator";
    }

    if (deviceId.endsWith("_SIM")) {
      setCommandStatus("Aguardando conexao com placa real. Bloqueado envio via MQTT.");
      return false;
    }

    const targetDevice = config.deviceFilter && config.deviceFilter !== "+" ? config.deviceFilter : deviceId;
    const topic = `amassadeira/${targetDevice}/cmd/${command}`;
    return new Promise<boolean>((resolve) => {
      client.publish(topic, payload, { qos: 1, retain: false }, (error) => {
        if (error) {
          setCommandStatus(`Falha ao publicar ${command}: ${error.message}`);
          resolve(false);
          return;
        }
        setCommandStatus(`Comando enviado: ${topic} ${payload}`);
        resolve(true);
      });
    });
  }

  // Business logic functions
  async function startCycle() {
    setCycleStatus("running");
    const targetDevice = latest.deviceId;
    await publishCommand("recipe", { action: "start", recipe: activeRecipe.code }, targetDevice);
    return true;
  }

  async function stopCycle() {
    setCycleStatus("idle");
    setElapsedTime(0);
    setSimTemp(21.5);
    const targetDevice = latest.deviceId;
    await publishCommand("recipe", { action: "stop", recipe: activeRecipe.code }, targetDevice);
    return true;
  }

  async function reloadCycle() {
    setCycleStatus("idle");
    setElapsedTime(0);
    setSimTemp(21.5);
    const targetDevice = latest.deviceId;
    await publishCommand("recipe", { action: "reload", recipe: activeRecipe.code }, targetDevice);
    return true;
  }

  async function pauseCycle() {
    setCycleStatus("paused");
    const targetDevice = latest.deviceId;
    await publishCommand("recipe", { action: "pause", recipe: activeRecipe.code }, targetDevice);
    return true;
  }

  async function emergencyCycle() {
    setCycleStatus("emergency");
    const targetDevice = latest.deviceId;
    await publishCommand("recipe", { action: "emergency_stop", recipe: activeRecipe.code }, targetDevice);
    return true;
  }

  return {
    latest,
    samples,
    metrics,
    config,
    setConfig,
    connection,
    commandStatus,
    publishCalibration,
    publishCommand,
    cycleStatus,
    setCycleStatus,
    elapsedTime,
    setElapsedTime,
    startCycle,
    stopCycle,
    reloadCycle,
    pauseCycle,
    emergencyCycle,
  };
}

function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (saved.brokerUrl && (saved.brokerUrl.includes("192.168.1.100") || saved.brokerUrl.includes("192.168.43.205") || saved.brokerUrl.includes("localhost"))) {
      delete saved.brokerUrl;
    }
    return { ...defaultConfig, ...saved };
  } catch {
    return defaultConfig;
  }
}

function pushSample(setter: Dispatch<SetStateAction<TelemetrySample[]>>, sample: TelemetrySample) {
  setter((current) => [...current, sample].slice(-MAX_HISTORY));
}
