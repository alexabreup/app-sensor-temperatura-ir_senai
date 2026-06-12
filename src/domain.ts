export type RecipeState = 0 | 1 | 2 | 3 | 4;

export type ConnectionMode = "mqtt" | "simulator";

export type CycleStatus = "running" | "paused" | "emergency" | "idle";

export type Recipe = {
  code: string;
  name: string;
  mixingTime: number;
  minTemp: number;
  maxTemp: number;
  criticalTemp: number;
  waterMl: number;
};

export function parseRecipeFromTxt(text: string): Partial<Recipe> {
  const lines = text.split(/\r?\n/);
  const recipe: Partial<Recipe> = {};
  
  for (const line of lines) {
    const parts = line.split(":");
    if (parts.length < 2) continue;
    
    const key = parts[0].trim().toUpperCase();
    const val = parts.slice(1).join(":").trim();
    
    if (key.includes("CODE") || key.includes("CÓDIGO") || key.includes("CODIGO")) {
      recipe.code = val;
    } else if (key.includes("NAME") || key.includes("NOME")) {
      recipe.name = val;
    } else if (key.includes("MIXING_TIME") || key.includes("TEMPO_MISTURA") || key.includes("TEMPO")) {
      recipe.mixingTime = Number(val) || 0;
    } else if (key.includes("MIN_TEMP") || key.includes("TEMP_MIN") || key.includes("MINIMA")) {
      recipe.minTemp = Number(val) || 0;
    } else if (key.includes("MAX_TEMP") || key.includes("TEMP_MAX") || key.includes("MAXIMA")) {
      recipe.maxTemp = Number(val) || 0;
    } else if (key.includes("CRITICAL_TEMP") || key.includes("TEMP_CRITICA") || key.includes("CRITICA")) {
      recipe.criticalTemp = Number(val) || 0;
    } else if (key.includes("WATER_ML") || key.includes("AGUA_ML") || key.includes("AGUA")) {
      recipe.waterMl = Number(val) || 0;
    }
  }
  return recipe;
}

export function exportRecipeToTxt(recipe: Recipe): string {
  return `CÓDIGO: ${recipe.code}
NOME: ${recipe.name}
TEMPO_MISTURA: ${recipe.mixingTime}
TEMP_MIN: ${recipe.minTemp}
TEMP_MAX: ${recipe.maxTemp}
TEMP_CRITICA: ${recipe.criticalTemp}
AGUA_ML: ${recipe.waterMl}`;
}

export type TelemetrySample = {
  ts: number;
  deviceId: string;
  temp: number;
  ambientTemp?: number;
  rawTemp?: number;
  correctedTemp?: number;
  state: RecipeState;
  timeRemaining: number;
  elapsedTime?: number;
  message: string;
  valid: boolean;
  source: ConnectionMode;
};

export type AppConfig = {
  brokerUrl: string;
  deviceFilter: string;
  clientId: string;
  mode: ConnectionMode;
};

export const stateLabels: Record<RecipeState, string> = {
  0: "Aguardando",
  1: "Temperatura OK",
  2: "Adicionar agua",
  3: "Critico",
  4: "Finalizado",
};

let host = typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "127.0.0.1";
if (host === "localhost") host = "127.0.0.1";

export const defaultConfig: AppConfig = {
  brokerUrl: `ws://${host}:9001`,
  deviceFilter: "+",
  clientId: `senai-hmi-${Math.random().toString(16).slice(2, 8)}`,
  mode: "mqtt",
};

export function normalizeTelemetry(topic: string, payload: string, source: ConnectionMode): TelemetrySample {
  const parsed = JSON.parse(payload) as Record<string, unknown>;
  const parts = topic.split("/");
  const deviceId = typeof parsed.device_id === "string" ? parsed.device_id : parts[1] ?? "amassadeira_desconhecida";
  const temp = numberFrom(parsed.temp, parsed.final_temp, parsed.current_temp);
  const state = clampState(numberFrom(parsed.state, 0));
  const timeRemaining = Math.max(0, numberFrom(parsed.time_remaining, parsed.timeRemaining, 0));
  const valid = parsed.is_valid === undefined ? temp > -50 : Boolean(parsed.is_valid);

  return {
    ts: Date.now(),
    deviceId,
    temp,
    ambientTemp: optionalNumber(parsed.amb_temp, parsed.ambientTemp, parsed.temp_amb),
    rawTemp: optionalNumber(parsed.obj_temp_raw, parsed.rawTemp),
    correctedTemp: optionalNumber(parsed.obj_temp_corrected, parsed.correctedTemp),
    state,
    timeRemaining,
    elapsedTime: optionalNumber(parsed.elapsed_time_s, parsed.elapsedTime),
    message: typeof parsed.msg === "string" ? parsed.msg : String(parsed.message ?? stateLabels[state]),
    valid,
    source,
  };
}

export function formatTime(totalSeconds: number) {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function numberFrom(...values: unknown[]) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function optionalNumber(...values: unknown[]) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function clampState(value: number): RecipeState {
  if (value < 0 || value > 4) return 0;
  return value as RecipeState;
}
