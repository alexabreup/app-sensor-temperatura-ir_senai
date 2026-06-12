import initSqlJs from "sql.js";
import type { Database } from "sql.js";
import { Recipe, TelemetrySample } from "./domain";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";

let dbInstance: Database | null = null;
let SQL: any = null;

async function getSQL() {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: () => sqlWasmUrl,
    });
  }
  return SQL;
}

// Low-level IndexedDB wrapper to store/load binary SQLite file
export function saveDbToIndexedDb(data: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("senai-ir-hmi-sqlite", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("files");
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("files", "readwrite");
      const store = tx.objectStore("files");
      const putRequest = store.put(data, "db");
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export function loadDbFromIndexedDb(): Promise<Uint8Array | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("senai-ir-hmi-sqlite", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("files");
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("files", "readonly");
      const store = tx.objectStore("files");
      const getRequest = store.get("db");
      getRequest.onsuccess = () => resolve(getRequest.result || null);
      getRequest.onerror = () => reject(getRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}

// Initialize SQLite WASM and load/migrate schemas
export async function initDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const sql = await getSQL();
  const savedData = await loadDbFromIndexedDb();

  if (savedData) {
    dbInstance = new sql.Database(savedData);
  } else {
    dbInstance = new sql.Database();
  }

  const db = dbInstance;
  if (!db) {
    throw new Error("Database failed to initialize");
  }

  // Create recipes table
  db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mixingTime INTEGER NOT NULL,
      minTemp REAL,
      maxTemp REAL,
      criticalTemp REAL,
      waterMl INTEGER
    )
  `);

  // Create telemetry history table
  db.run(`
    CREATE TABLE IF NOT EXISTS telemetry_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      deviceId TEXT NOT NULL,
      temp REAL NOT NULL,
      ambientTemp REAL,
      rawTemp REAL,
      correctedTemp REAL,
      state INTEGER NOT NULL,
      timeRemaining INTEGER NOT NULL,
      elapsedTime REAL,
      message TEXT,
      source TEXT
    )
  `);

  await persistDb();
  return db;
}

// Serialize database in-memory state and write to browser persistent IndexedDB storage
export async function persistDb() {
  if (!dbInstance) return;
  const binaryArray = dbInstance.export();
  await saveDbToIndexedDb(binaryArray);
}

// Recipe SQL Operations
export async function saveRecipeInSqlite(recipe: Recipe) {
  const db = await initDatabase();
  db.run(
    "INSERT OR REPLACE INTO recipes (code, name, mixingTime, minTemp, maxTemp, criticalTemp, waterMl) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [recipe.code, recipe.name, recipe.mixingTime, recipe.minTemp, recipe.maxTemp, recipe.criticalTemp, recipe.waterMl]
  );
  await persistDb();
}

export async function loadRecipesFromSqlite(): Promise<Recipe[]> {
  const db = await initDatabase();
  const res = db.exec("SELECT code, name, mixingTime, minTemp, maxTemp, criticalTemp, waterMl FROM recipes");
  if (res.length === 0) return [];
  
  const values = res[0].values;
  return values.map((row) => ({
    code: row[0] as string,
    name: row[1] as string,
    mixingTime: Number(row[2]),
    minTemp: Number(row[3]),
    maxTemp: Number(row[4]),
    criticalTemp: Number(row[5]),
    waterMl: Number(row[6]),
  }));
}

export async function deleteRecipeFromSqlite(code: string) {
  const db = await initDatabase();
  db.run("DELETE FROM recipes WHERE code = ?", [code]);
  await persistDb();
}

// Telemetry History SQL Operations
export async function saveTelemetryInSqlite(sample: TelemetrySample) {
  const db = await initDatabase();
  db.run(
    `INSERT INTO telemetry_history 
     (ts, deviceId, temp, ambientTemp, rawTemp, correctedTemp, state, timeRemaining, elapsedTime, message, source) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sample.ts,
      sample.deviceId,
      sample.temp,
      sample.ambientTemp !== undefined ? sample.ambientTemp : null,
      sample.rawTemp !== undefined ? sample.rawTemp : null,
      sample.correctedTemp !== undefined ? sample.correctedTemp : null,
      sample.state,
      sample.timeRemaining,
      sample.elapsedTime !== undefined ? sample.elapsedTime : null,
      sample.message,
      sample.source,
    ]
  );
  await persistDb();
}

export async function loadTelemetryHistoryFromSqlite(limit: number = 100): Promise<TelemetrySample[]> {
  const db = await initDatabase();
  const res = db.exec(`
    SELECT ts, deviceId, temp, ambientTemp, rawTemp, correctedTemp, state, timeRemaining, elapsedTime, message, source 
    FROM telemetry_history 
    ORDER BY ts DESC 
    LIMIT ?
  `, [limit]);
  
  if (res.length === 0) return [];
  
  const values = res[0].values;
  return values.map((row) => ({
    ts: Number(row[0]),
    deviceId: row[1] as string,
    temp: Number(row[2]),
    ambientTemp: row[3] !== null ? Number(row[3]) : undefined,
    rawTemp: row[4] !== null ? Number(row[4]) : undefined,
    correctedTemp: row[5] !== null ? Number(row[5]) : undefined,
    state: Number(row[6]) as any,
    timeRemaining: Number(row[7]),
    elapsedTime: row[8] !== null ? Number(row[8]) : undefined,
    message: row[9] as string,
    valid: true,
    source: row[10] as any,
  })).reverse(); // Return in chronological order
}
