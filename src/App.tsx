import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Gauge,
  Pause,
  Play,
  Power,
  Radio,
  RotateCcw,
  Save,
  Settings,
  SlidersHorizontal,
  Thermometer,
  Wifi,
  Trash2,
  Download,
  Upload,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AppConfig,
  RecipeState,
  formatTime,
  stateLabels,
  Recipe,
  CycleStatus,
  parseRecipeFromTxt,
  exportRecipeToTxt,
  TelemetrySample,
} from "./domain";
import { useTelemetry } from "./useTelemetry";
import {
  initDatabase,
  saveRecipeInSqlite,
  loadRecipesFromSqlite,
  deleteRecipeFromSqlite,
} from "./db";

type Page = "monitoring" | "programming" | "modes" | "recipes";
type OperationMode = "automatic" | "assisted" | "calibration" | "diagnostic";

const initialRecipes: Recipe[] = [
  { code: "PF-025", name: "Pão de Batata 25kg", mixingTime: 480, minTemp: 22, maxTemp: 26, criticalTemp: 28, waterMl: 300 },
  { code: "PB-018", name: "Pao de Batata 18kg", mixingTime: 420, minTemp: 21, maxTemp: 25, criticalTemp: 27, waterMl: 240 },
  { code: "PI-030", name: "Pizza Industrial 30kg", mixingTime: 540, minTemp: 20, maxTemp: 24, criticalTemp: 26, waterMl: 350 },
];

const navItems: Array<{ page: Page; label: string; icon: ReactNode }> = [
  { page: "monitoring", label: "Monitoramento", icon: <Gauge /> },
  { page: "programming", label: "Programacao", icon: <SlidersHorizontal /> },
  { page: "modes", label: "Modos", icon: <Activity /> },
  { page: "recipes", label: "Receitas", icon: <BookOpen /> },
];

const RECIPES_STORAGE_KEY = "senai-ir-hmi-recipes";
const ACTIVE_RECIPE_CODE_KEY = "senai-ir-hmi-active-recipe-code";

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function App() {
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    try {
      const saved = localStorage.getItem(RECIPES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialRecipes;
    } catch {
      return initialRecipes;
    }
  });

  const [activeRecipeCode, setActiveRecipeCode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_RECIPE_CODE_KEY);
      return saved && saved !== "undefined" ? saved : initialRecipes[0].code;
    } catch {
      return initialRecipes[0].code;
    }
  });

  const activeRecipe = useMemo(() => {
    return recipes.find((recipe) => recipe.code === activeRecipeCode) ?? recipes[0] ?? initialRecipes[0];
  }, [recipes, activeRecipeCode]);

  useEffect(() => {
    localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_RECIPE_CODE_KEY, activeRecipeCode);
  }, [activeRecipeCode]);

  const telemetry = useTelemetry(activeRecipe);
  const {
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
  } = telemetry;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const [page, setPage] = useState<Page>(() => pageFromHash());
  const [operationMode, setOperationMode] = useState<OperationMode>("automatic");
  const [events, setEvents] = useState<string[]>(["HMI inicializada em modo simulador/local"]);

  const progress = Math.min(100, Math.max(0, ((activeRecipe.mixingTime - latest.timeRemaining) / activeRecipe.mixingTime) * 100));
  const danger = latest.state === 3 || !latest.valid || cycleStatus === "emergency";
  const effectiveState: RecipeState = cycleStatus === "emergency" ? 3 : latest.state;

  useEffect(() => {
    const syncHash = () => setPage(pageFromHash());
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [page]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", mobileMenuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    async function setupDb() {
      try {
        await initDatabase();
        const sqliteRecipes = await loadRecipesFromSqlite();
        if (sqliteRecipes.length > 0) {
          setRecipes(sqliteRecipes);
        } else {
          // Database is empty, seed it with initial recipes
          for (const recipe of initialRecipes) {
            await saveRecipeInSqlite(recipe);
          }
        }
        logEvent("Banco de dados SQLite (WASM) inicializado");
      } catch (error) {
        logEvent(`Erro SQLite (WASM): ${(error as Error).message}`);
      }
    }
    setupDb();
  }, []);

  function logEvent(message: string) {
    const stamped = `${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} - ${message}`;
    setEvents((current) => [stamped, ...current].slice(0, 8));
  }

  async function sendOperatorCommand(command: string, payload: Record<string, unknown>, label: string) {
    await publishCommand(command, payload, latest.deviceId);
    logEvent(label);
  }

  function openPage(nextPage: Page) {
    window.history.pushState(null, "", `#${nextPage}`);
    setPage(nextPage);
  }

  // Recipes actions
  const handleCreateRecipe = (newRecipe: Recipe) => {
    setRecipes((prev) => [...prev, newRecipe]);
    saveRecipeInSqlite(newRecipe).catch((err) => console.error("SQLite Save error:", err));
    logEvent(`Receita criada: ${newRecipe.code} (${newRecipe.name})`);
  };

  const handleUpdateRecipe = (updatedRecipe: Recipe) => {
    setRecipes((prev) => prev.map((r) => (r.code === updatedRecipe.code ? updatedRecipe : r)));
    saveRecipeInSqlite(updatedRecipe).catch((err) => console.error("SQLite Update error:", err));
    logEvent(`Receita atualizada: ${updatedRecipe.code}`);
  };

  const handleDeleteRecipe = (code: string) => {
    setRecipes((prev) => prev.filter((r) => r.code !== code));
    deleteRecipeFromSqlite(code).catch((err) => console.error("SQLite Delete error:", err));
    if (activeRecipeCode === code) {
      const firstRemaining = recipes.find((r) => r.code !== code);
      if (firstRemaining) {
        setActiveRecipeCode(firstRemaining.code);
      }
    }
    logEvent(`Receita excluída: ${code}`);
  };

  const handleImportRecipes = (importedList: Recipe[]) => {
    setRecipes((prev) => {
      const filteredPrev = prev.filter((r) => !importedList.some((imp) => imp.code === r.code));
      return [...filteredPrev, ...importedList];
    });
    importedList.forEach((r) => {
      saveRecipeInSqlite(r).catch((err) => console.error("SQLite Import error:", err));
      logEvent(`Receita importada: ${r.code}`);
    });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand-button" onClick={() => openPage("monitoring")}>
          <img src="/img/UNISENAI.png" alt="UNISENAI" className="brand-logo" />
          <span className="brand-copy">
            <strong>G.PANIZ AE25G2</strong>
            <span>SENAI IR HMI</span>
          </span>
        </button>
        <button className="icon-button mobile-menu-toggle" onClick={toggleMobileMenu} title="Menu" aria-label="Abrir menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="top-actions">
          <div className={`status-pill ${config.mode}`}>
            <Wifi size={18} />
            <span>{connection}</span>
          </div>
          <button className="icon-button" title="Configurar conexao" onClick={() => openPage("monitoring")}>
            <Settings size={20} />
          </button>
        </div>
        <div className={`mobile-nav-overlay ${mobileMenuOpen ? "open" : ""}`} aria-hidden={!mobileMenuOpen}>
          <div className="mobile-nav-backdrop" onClick={() => setMobileMenuOpen(false)} />
          <nav className={`mobile-nav ${mobileMenuOpen ? "open" : ""}`} aria-label="Navegação principal">
            <div className="mobile-nav-header">
              <strong>Menu</strong>
              <button className="icon-button" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu" title="Fechar menu">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            {navItems.map((item) => (
              <a
                key={item.page}
                className={page === item.page ? "active" : ""}
                href={`#${item.page}`}
                onClick={(event) => {
                  event.preventDefault();
                  openPage(item.page);
                }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              ))}
            <div className="mobile-nav-footer">
              Desenvolvido por{" "}
              <a href="https://alexandrepereira.netlify.app/pt/" target="_blank" rel="noreferrer">
                Alexandre Pereira
              </a>{" "}
              para o PRINT5 2026 UniSENAI - SP
            </div>
          </nav>
        </div>
      </header>

      <aside className="sidebar">
        <div className="nav-title">
          <span>Mixer Control</span>
          <small>{activeRecipe.code} · {operationMode}</small>
        </div>
        <nav>
          {navItems.map((item) => (
            <a
              key={item.page}
              className={page === item.page ? "active" : ""}
              href={`#${item.page}`}
              onClick={(event) => {
                event.preventDefault();
                openPage(item.page);
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="side-telemetry">
          <span>Temperatura</span>
          <strong>{latest.temp.toFixed(2)} C</strong>
          <small>{stateLabels[effectiveState]}</small>
        </div>
        <div className="sidebar-footer">
          <span>Desenvolvido por</span>
          <a href="https://alexandrepereira.netlify.app/pt/" target="_blank" rel="noreferrer">
            Alexandre Pereira
          </a>
          <span>PRINT5 2026 UniSENAI-SP</span>
        </div>
      </aside>

      <main className="content">
        {page === "monitoring" && (
          <MonitoringPage
            latest={latest}
            samples={samples}
            metrics={metrics}
            activeRecipe={activeRecipe}
            cycleStatus={cycleStatus}
            effectiveState={effectiveState}
            progress={progress}
            danger={danger}
            config={config}
            setConfig={setConfig}
            commandStatus={commandStatus}
            publishCalibration={publishCalibration}
            events={events}
            onStart={async () => {
              await startCycle();
              logEvent("Ciclo de mistura iniciado");
            }}
            onPause={async () => {
              await pauseCycle();
              logEvent("Ciclo de mistura pausado");
            }}
            onStop={async () => {
              await stopCycle();
              logEvent("Ciclo interrompido/parado");
            }}
            onReload={async () => {
              await reloadCycle();
              logEvent("Ciclo reiniciado e recarregado");
            }}
            onEmergency={async () => {
              await emergencyCycle();
              logEvent("Parada de emergência acionada!");
            }}
          />
        )}

        {page === "programming" && (
          <ProgrammingPage
            recipe={activeRecipe}
            latestTemp={latest.temp}
            progress={progress}
            onSave={(updated) => {
              handleUpdateRecipe(updated);
              sendOperatorCommand("recipe", { action: "save_program", recipe: updated }, `Programa ${updated.code} atualizado`);
            }}
          />
        )}

        {page === "modes" && (
          <ModesPage
            activeMode={operationMode}
            state={effectiveState}
            temp={latest.temp}
            onSelectMode={(mode) => {
              setOperationMode(mode);
              sendOperatorCommand("recipe", { action: "set_mode", mode }, `Modo ${mode} selecionado`);
            }}
          />
        )}

        {page === "recipes" && (
          <RecipesPage
            recipes={recipes}
            activeRecipeCode={activeRecipeCode}
            onSelect={(recipe) => {
              setActiveRecipeCode(recipe.code);
              reloadCycle();
              logEvent(`Receita ${recipe.code} carregada`);
            }}
            onCreateRecipe={handleCreateRecipe}
            onUpdateRecipe={handleUpdateRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onImportRecipes={handleImportRecipes}
          />
        )}
      </main>
    </div>
  );
}

function pageFromHash(): Page {
  const hash = window.location.hash.replace("#", "");
  return navItems.some((item) => item.page === hash) ? (hash as Page) : "monitoring";
}

function MonitoringPage({
  latest,
  samples,
  metrics,
  activeRecipe,
  cycleStatus,
  effectiveState,
  progress,
  danger,
  config,
  setConfig,
  commandStatus,
  publishCalibration,
  events,
  onStart,
  onPause,
  onStop,
  onReload,
  onEmergency,
}: {
  latest: TelemetrySample;
  samples: TelemetrySample[];
  metrics: { avg: number; peak: number; trend: number };
  activeRecipe: Recipe;
  cycleStatus: CycleStatus;
  effectiveState: RecipeState;
  progress: number;
  danger: boolean;
  config: AppConfig;
  setConfig: (next: AppConfig) => void;
  commandStatus: string;
  publishCalibration: (offsetC: number, deviceId: string) => Promise<boolean>;
  events: string[];
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReload: () => void;
  onEmergency: () => void;
}) {
  const chartData = samples.length > 0 ? samples : [latest];

  return (
    <>
      <section className={`hero-panel process-panel ${danger ? "danger" : ""}`}>
        <div className="process-header">
          <div>
            <span className={`process-chip ${danger ? "danger" : ""}`}>
              {cycleStatus === "paused" ? "Pausado" : cycleStatus === "idle" ? "Aguardando" : stateLabels[effectiveState]}
            </span>
            <h1>{activeRecipe.name}</h1>
            <p>{latest.message} · {activeRecipe.code}</p>
          </div>
          <div className="timer">
            <span>Tempo restante</span>
            <strong>{formatTime(latest.timeRemaining)}</strong>
          </div>
        </div>
        <div className="progress-row">
          <span>Progresso do ciclo</span>
          <b>{progress.toFixed(0)}%</b>
        </div>
        <div className="progress-track"><div style={{ width: `${progress}%` }} /></div>
        <div className="action-row">
          {cycleStatus !== "running" ? (
            <button className="success" onClick={onStart}>
              <Play size={18} /> INICIAR
            </button>
          ) : (
            <button className="warning" onClick={onPause}>
              <Pause size={18} /> PAUSAR
            </button>
          )}
          {(cycleStatus === "running" || cycleStatus === "paused") && (
            <button className="secondary" onClick={onStop} style={{ background: "#f1f3f5", border: "1px solid #ced4da" }}>
              <Power size={18} /> PARAR
            </button>
          )}
          <button className="info" onClick={onReload}>
            <RotateCcw size={18} /> RECARREGAR
          </button>
          <button className="critical" onClick={onEmergency}>
            <Power size={18} /> PARADA EMERGÊNCIA
          </button>
        </div>
      </section>

      <section className="metric-grid">
        <Metric icon={<Thermometer />} label="Temperatura da massa" value={latest.temp.toFixed(2)} unit="C" danger={danger} />
        <Metric icon={<Radio />} label="Ambiente MLX90614" value={(latest.ambientTemp ?? 0).toFixed(2)} unit="C" />
        <Metric icon={<Activity />} label="Media 30 amostras" value={metrics.avg.toFixed(2)} unit="C" />
        <Metric icon={<AlertTriangle />} label="Pico recente" value={metrics.peak.toFixed(2)} unit="C" danger={metrics.peak >= activeRecipe.criticalTemp} />
      </section>

      <section className="chart-panel">
        <div className="section-title">
          <div>
            <h2>Curva termica em tempo real</h2>
            <p>{latest.deviceId} · fonte {latest.source}</p>
          </div>
          <strong className={metrics.trend > 0.2 ? "warming" : "stable"}>{metrics.trend >= 0 ? "+" : ""}{metrics.trend.toFixed(2)} C</strong>
        </div>
        <TemperatureChart samples={chartData} criticalTemp={activeRecipe.criticalTemp} />
      </section>

      <section className="lower-grid">
        <ConnectionPanel config={config} setConfig={setConfig} />
        <div className="stack">
          <CalibrationPanel
            currentTemp={latest.temp}
            deviceId={latest.deviceId}
            commandStatus={commandStatus}
            publishCalibration={publishCalibration}
          />
          <EventLog events={events} />
        </div>
      </section>
    </>
  );
}

function TemperatureChart({ samples, criticalTemp }: { samples: TelemetrySample[]; criticalTemp: number }) {
  const width = 960;
  const height = 280;
  const padding = { left: 48, right: 18, top: 18, bottom: 34 };
  const minTemp = 18;
  const maxTemp = Math.max(32, criticalTemp + 2);
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;
  const points = samples.map((sample, index) => {
    const x = padding.left + (samples.length <= 1 ? usableWidth : (index / (samples.length - 1)) * usableWidth);
    const normalized = (sample.temp - minTemp) / (maxTemp - minTemp);
    const y = padding.top + usableHeight - Math.min(1, Math.max(0, normalized)) * usableHeight;
    return { x, y, sample };
  });
  const line = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area = `${padding.left},${padding.top + usableHeight} ${line} ${padding.left + usableWidth},${padding.top + usableHeight}`;
  const criticalY = padding.top + usableHeight - ((criticalTemp - minTemp) / (maxTemp - minTemp)) * usableHeight;
  const last = points[points.length - 1];

  return (
    <div className="chart-box" aria-label="Curva termica do processo">
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <defs>
          <linearGradient id="tempArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#b40009" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#b40009" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((row) => {
          const y = padding.top + (row / 3) * usableHeight;
          const value = maxTemp - (row / 3) * (maxTemp - minTemp);
          return (
            <g key={row}>
              <line x1={padding.left} x2={padding.left + usableWidth} y1={y} y2={y} className="chart-grid" />
              <text x={10} y={y + 4} className="chart-label">{value.toFixed(0)} C</text>
            </g>
          );
        })}
        <line x1={padding.left} x2={padding.left + usableWidth} y1={criticalY} y2={criticalY} className="chart-critical" />
        <text x={padding.left + usableWidth - 84} y={criticalY - 8} className="chart-critical-label">CRITICO</text>
        <polygon points={area} fill="url(#tempArea)" />
        <polyline points={line} className="chart-line" />
        {last && (
          <g>
            <circle cx={last.x} cy={last.y} r="6" className="chart-dot" />
            <text x={Math.max(padding.left, last.x - 82)} y={last.y - 14} className="chart-value">{last.sample.temp.toFixed(2)} C</text>
          </g>
        )}
      </svg>
    </div>
  );
}

function CalibrationPanel({
  currentTemp,
  deviceId,
  commandStatus,
  publishCalibration,
}: {
  currentTemp: number;
  deviceId: string;
  commandStatus: string;
  publishCalibration: (offsetC: number, deviceId: string) => Promise<boolean>;
}) {
  const [targetTemp, setTargetTemp] = useState("25.00");
  const offset = useMemo(() => Number(targetTemp) - currentTemp, [currentTemp, targetTemp]);
  const offsetSafe = Number.isFinite(offset) ? offset : 0;
  const outOfRange = offsetSafe < -5 || offsetSafe > 5;

  return (
    <section className="calibration-panel">
      <div className="section-title compact">
        <div>
          <h2>Calibracao de campo</h2>
          <p>{deviceId}</p>
        </div>
        <Thermometer size={20} />
      </div>
      <div className="calibration-grid">
        <label>Temperatura referencia
          <input inputMode="decimal" value={targetTemp} onChange={(event) => setTargetTemp(event.target.value)} />
        </label>
        <div className={`offset-readout ${outOfRange ? "danger" : ""}`}>
          <span>Offset calculado</span>
          <strong>{offsetSafe.toFixed(2)} C</strong>
        </div>
      </div>
      <button className="send-command" disabled={outOfRange} onClick={() => publishCalibration(offsetSafe, deviceId)}>
        <Save size={18} /> ENVIAR OFFSET MQTT
      </button>
      <p className="hint">{outOfRange ? "Offset fora do limite aceito pelo firmware (-5 C a +5 C)." : commandStatus}</p>
    </section>
  );
}

function Metric({ icon, label, value, unit, danger = false }: { icon: ReactNode; label: string; value: string; unit: string; danger?: boolean }) {
  return (
    <article className={`metric-card ${danger ? "danger" : ""}`}>
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value} <small>{unit}</small></strong>
      </div>
    </article>
  );
}

function ConnectionPanel({ config, setConfig }: { config: AppConfig; setConfig: (next: AppConfig) => void }) {
  return (
    <section className="settings-panel">
      <div className="section-title compact">
        <h2>Conexao IoT</h2>
        <Settings size={20} />
      </div>
      <label>Modo
        <select value={config.mode} onChange={(event) => setConfig({ ...config, mode: event.target.value as AppConfig["mode"] })}>
          <option value="simulator">Simulador local</option>
          <option value="mqtt">MQTT WebSocket</option>
        </select>
      </label>
      <label>Broker WebSocket
        <input value={config.brokerUrl} onChange={(event) => setConfig({ ...config, brokerUrl: event.target.value })} placeholder="ws://192.168.1.100:9001" />
      </label>
      <label>Filtro do dispositivo
        <input value={config.deviceFilter} onChange={(event) => setConfig({ ...config, deviceFilter: event.target.value })} placeholder="+ ou amassadeira_A1B2C3" />
      </label>
      <p className="hint">Assina `amassadeira/{'{device}'}/telemetry` e publica comandos em `amassadeira/{'{device}'}/cmd/*`.</p>
    </section>
  );
}

function ProgrammingPage({ recipe, latestTemp, progress, onSave }: { recipe: Recipe; latestTemp: number; progress: number; onSave: (recipe: Recipe) => void }) {
  const [form, setForm] = useState(recipe);

  useEffect(() => setForm(recipe), [recipe]);

  function updateNumber(key: keyof Recipe, value: string) {
    setForm((current) => ({ ...current, [key]: Number(value) }));
  }

  return (
    <>
      <section className="page-header-panel">
        <span className="process-chip">PROGRAMACAO</span>
        <h1>Parametros do ciclo</h1>
        <p>Edite a receita ativa e envie o pacote de programa para o canal MQTT da HMI.</p>
      </section>
      <section className="programming-grid">
        <div className="settings-panel">
          <div className="section-title compact"><h2>{form.code}</h2></div>
          <label>Nome da receita
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>Tempo de mistura
            <input type="number" value={form.mixingTime} onChange={(event) => updateNumber("mixingTime", event.target.value)} />
          </label>
          <label>Temperatura minima
            <input type="number" step="0.1" value={form.minTemp} onChange={(event) => updateNumber("minTemp", event.target.value)} />
          </label>
          <label>Temperatura maxima
            <input type="number" step="0.1" value={form.maxTemp} onChange={(event) => updateNumber("maxTemp", event.target.value)} />
          </label>
          <label>Temperatura critica
            <input type="number" step="0.1" value={form.criticalTemp} onChange={(event) => updateNumber("criticalTemp", event.target.value)} />
          </label>
          <button className="send-command" onClick={() => onSave(form)}><Save size={18} />SALVAR PROGRAMA</button>
        </div>
        <div className="card-list">
          <div className="section-title compact"><h2>Intervencoes por temperatura</h2></div>
          <article className="recipe-row"><div><b>Adicionar agua gelada</b><span>TH-MAX</span></div><span>{form.maxTemp.toFixed(1)} C</span><strong>{form.waterMl} ml</strong></article>
          <article className="recipe-row"><div><b>Faixa ideal</b><span>WINDOW</span></div><span>{form.minTemp.toFixed(1)}-{form.maxTemp.toFixed(1)} C</span><strong>OK</strong></article>
          <article className="recipe-row"><div><b>Alarme critico</b><span>LIMIT</span></div><span>{form.criticalTemp.toFixed(1)} C</span><strong>BUZZER</strong></article>
        </div>
        <div className="hero-panel compact-process">
          <div className="process-header">
            <div>
              <span className="process-chip">PREVIEW</span>
              <h1>{latestTemp.toFixed(2)} C</h1>
              <p>Progresso atual usado como referencia para ajustes.</p>
            </div>
            <div className="timer"><span>Ciclo</span><strong>{progress.toFixed(0)}%</strong></div>
          </div>
        </div>
      </section>
    </>
  );
}

function ModesPage({ activeMode, state, temp, onSelectMode }: { activeMode: OperationMode; state: RecipeState; temp: number; onSelectMode: (mode: OperationMode) => void }) {
  const modes: Array<{ id: OperationMode; name: string; description: string }> = [
    { id: "automatic", name: "Automatico", description: "Executa receita com alertas por temperatura e progresso do ciclo." },
    { id: "assisted", name: "Manual assistido", description: "Operador confirma cada etapa de resfriamento e intervencao." },
    { id: "calibration", name: "Calibracao", description: "Prioriza leitura estabilizada e envio de offset ao ESP32-S3." },
    { id: "diagnostic", name: "Diagnostico", description: "Foco em sensor, MQTT, status e estabilidade termica." },
  ];

  return (
    <>
      <section className="page-header-panel">
        <span className="process-chip">MODOS</span>
        <h1>Operacao hibrida</h1>
        <p>Selecione o comportamento da HMI conforme bancada, treinamento ou operacao industrial.</p>
      </section>
      <section className="mode-grid">
        {modes.map((mode) => (
          <button key={mode.id} className={`mode-card ${activeMode === mode.id ? "active" : ""}`} onClick={() => onSelectMode(mode.id)}>
            <div>
              <h2>{mode.name}</h2>
              <p>{mode.description}</p>
            </div>
            <span>{activeMode === mode.id ? "ATIVO" : "SELECIONAR"}</span>
          </button>
        ))}
      </section>
      <section className="metric-grid">
        <Metric icon={<Thermometer />} label="Temperatura atual" value={temp.toFixed(2)} unit="C" />
        <Metric icon={<Activity />} label="Estado da receita" value={String(state)} unit="ISA-88" />
      </section>
    </>
  );
}

interface RecipesPageProps {
  recipes: Recipe[];
  activeRecipeCode: string;
  onSelect: (recipe: Recipe) => void;
  onCreateRecipe: (recipe: Recipe) => void;
  onUpdateRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (code: string) => void;
  onImportRecipes: (imported: Recipe[]) => void;
}

function RecipesPage({
  recipes,
  activeRecipeCode,
  onSelect,
  onCreateRecipe,
  onUpdateRecipe,
  onDeleteRecipe,
  onImportRecipes,
}: RecipesPageProps) {
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<Recipe>({
    code: "",
    name: "",
    mixingTime: 300,
    minTemp: 21,
    maxTemp: 25,
    criticalTemp: 28,
    waterMl: 250,
  });

  const handleEditClick = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setForm(recipe);
    setShowCreateForm(false);
  };

  const handleCreateClick = () => {
    setEditingRecipe(null);
    setForm({
      code: "",
      name: "",
      mixingTime: 300,
      minTemp: 21,
      maxTemp: 25,
      criticalTemp: 28,
      waterMl: 250,
    });
    setShowCreateForm(true);
  };

  const handleCancel = () => {
    setEditingRecipe(null);
    setShowCreateForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) {
      alert("Por favor, preencha código e nome da receita.");
      return;
    }
    if (editingRecipe) {
      onUpdateRecipe(form);
      setEditingRecipe(null);
    } else {
      if (recipes.some((r) => r.code === form.code)) {
        alert("Já existe uma receita com este código!");
        return;
      }
      onCreateRecipe(form);
      setShowCreateForm(false);
    }
  };

  const handleDownloadJson = (recipe: Recipe) => {
    const jsonStr = JSON.stringify(recipe, null, 2);
    downloadFile(`receita_${recipe.code}.json`, jsonStr, "application/json");
  };

  const handleDownloadTxt = (recipe: Recipe) => {
    const txtStr = exportRecipeToTxt(recipe);
    downloadFile(`receita_${recipe.code}.txt`, txtStr, "text/plain");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(content);
          const imported: Recipe[] = [];
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              if (item.code && item.name) imported.push(item);
            });
          } else if (parsed.code && parsed.name) {
            imported.push(parsed);
          }
          if (imported.length > 0) {
            onImportRecipes(imported);
          } else {
            alert("Nenhuma receita válida encontrada no JSON.");
          }
        } catch (err) {
          alert("Erro ao decodificar JSON: " + (err as Error).message);
        }
      } else if (file.name.endsWith(".txt")) {
        try {
          const parsed = parseRecipeFromTxt(content);
          if (parsed.code && parsed.name) {
            const recipe: Recipe = {
              code: parsed.code,
              name: parsed.name,
              mixingTime: parsed.mixingTime ?? 300,
              minTemp: parsed.minTemp ?? 21,
              maxTemp: parsed.maxTemp ?? 25,
              criticalTemp: parsed.criticalTemp ?? 28,
              waterMl: parsed.waterMl ?? 250,
            };
            onImportRecipes([recipe]);
          } else {
            alert("Não foi possível extrair código e nome do arquivo TXT. Verifique o formato.");
          }
        } catch (err) {
          alert("Erro ao decodificar TXT: " + (err as Error).message);
        }
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <>
      <section className="page-header-panel">
        <span className="process-chip">BIBLIOTECA</span>
        <h1>Receitas industriais</h1>
        <p>Selecione, crie, edite ou salve receitas em JSON e TXT interpretável.</p>
        
        <div style={{ marginTop: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button className="secondary" onClick={handleCreateClick} style={{ minHeight: "44px", padding: "0 16px" }}>
            <Plus size={16} style={{ marginRight: "6px" }} /> NOVA RECEITA
          </button>
          
          <label className="secondary" style={{
            minHeight: "44px",
            padding: "0 16px",
            border: "1px solid var(--outline)",
            borderRadius: "6px",
            background: "var(--surface-low)",
            color: "var(--primary)",
            fontWeight: "800",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontSize: "14px",
            transition: "filter 160ms ease"
          }}>
            <Upload size={16} /> IMPORTAR RECEITA (.JSON / .TXT)
            <input type="file" accept=".json,.txt" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>
        </div>
      </section>

      <div>
        <div className="card-list">
          <div className="section-title compact"><h2>Biblioteca de receitas</h2></div>
          {recipes.map((recipe) => (
            <article key={recipe.code} className={`recipe-row ${activeRecipeCode === recipe.code ? "selected" : ""}`}>
              <div className="recipe-main">
                <b>{recipe.name}</b>
                <span>{recipe.code}</span>
              </div>
              <div className="recipe-meta">
                <span className="recipe-range">{recipe.minTemp}-{recipe.maxTemp} C</span>
                <strong>{recipe.criticalTemp} C</strong>
              </div>
              <div className="recipe-actions">
                <button className="icon-button recipe-icon-button" title="Editar Receita" onClick={() => handleEditClick(recipe)}>
                  <SlidersHorizontal size={16} />
                </button>

                <button className="icon-button recipe-icon-button" title="Baixar JSON" onClick={() => handleDownloadJson(recipe)}>
                  <Download size={16} />
                </button>

                <button className="icon-button recipe-icon-button" title="Baixar TXT" onClick={() => handleDownloadTxt(recipe)}>
                  <BookOpen size={16} />
                </button>

                {recipes.length > 1 && (
                  <button className="icon-button recipe-icon-button danger" title="Excluir" onClick={() => {
                    if (confirm(`Excluir a receita ${recipe.name}?`)) onDeleteRecipe(recipe.code);
                  }}>
                    <Trash2 size={16} />
                  </button>
                )}

                <button className="recipe-select" onClick={() => onSelect(recipe)}>
                  {activeRecipeCode === recipe.code ? <CheckCircle2 size={16} /> : <Play size={16} />}
                  {activeRecipeCode === recipe.code ? " ATIVA" : " CARREGAR"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {(showCreateForm || editingRecipe) && (
        <div className="modal-backdrop" onClick={handleCancel}>
          <form className="modal-content" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
            <div className="section-title compact">
              <h2>{editingRecipe ? `Editar: ${editingRecipe.code}` : "Nova Receita"}</h2>
            </div>
            
            {!editingRecipe && (
              <label>Código da Receita
                <input required placeholder="Ex: PF-025" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} style={{ width: "100%", padding: "8px", marginTop: "4px" }} />
              </label>
            )}

            <label>Nome da Receita
              <input required placeholder="Ex: Pão de Centeio" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: "100%", padding: "8px", marginTop: "4px" }} />
            </label>

            <label>Tempo de mistura (segundos)
              <input type="number" required min="10" value={form.mixingTime} onChange={(e) => setForm({ ...form, mixingTime: Number(e.target.value) })} style={{ width: "100%", padding: "8px", marginTop: "4px" }} />
            </label>

            <label>Temperatura Mínima (°C)
              <input type="number" step="0.1" required value={form.minTemp} onChange={(e) => setForm({ ...form, minTemp: Number(e.target.value) })} style={{ width: "100%", padding: "8px", marginTop: "4px" }} />
            </label>

            <label>Temperatura Máxima (°C)
              <input type="number" step="0.1" required value={form.maxTemp} onChange={(e) => setForm({ ...form, maxTemp: Number(e.target.value) })} style={{ width: "100%", padding: "8px", marginTop: "4px" }} />
            </label>

            <label>Temperatura Crítica (°C)
              <input type="number" step="0.1" required value={form.criticalTemp} onChange={(e) => setForm({ ...form, criticalTemp: Number(e.target.value) })} style={{ width: "100%", padding: "8px", marginTop: "4px" }} />
            </label>

            <label>Volume de Água (ml)
              <input type="number" required value={form.waterMl} onChange={(e) => setForm({ ...form, waterMl: Number(e.target.value) })} style={{ width: "100%", padding: "8px", marginTop: "4px" }} />
            </label>

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button type="submit" className="send-command" style={{ flex: 1, minHeight: "44px" }}>
                <Save size={16} /> SALVAR
              </button>
              <button type="button" className="secondary" onClick={handleCancel} style={{ flex: 1, minHeight: "44px", border: "1px solid var(--outline)" }}>
                CANCELAR
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function EventLog({ events }: { events: string[] }) {
  return (
    <section className="event-log">
      <div className="section-title compact">
        <h2>Eventos do operador</h2>
        <AlertOctagon size={20} />
      </div>
      <div className="event-list">
        {events.map((event, index) => <p key={`${event}-${index}`}>{event}</p>)}
      </div>
    </section>
  );
}
