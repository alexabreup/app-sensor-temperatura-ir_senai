# Filtro de Kalman — Integração Firmware-Web

## Contexto

O filtro de Kalman é implementado **no firmware do ESP32-S3** (projeto `sensor-temperatura-ir_senai`), não no dashboard web. O dashboard React recebe os dados **já filtrados** via MQTT e apenas os exibe graficamente.

Este documento explica como o filtro funciona no firmware e como seus parâmetros podem ser ajustados remotamente pelo dashboard.

---

## Arquitetura da Cadeia de Sinal

```
Sensor IR (MLX90614)
    │  Leitura I²C a cada 500ms
    ▼
Correção de Emissividade
    │  T_raw → T_emissivity (compensa superfície não-negra)
    ▼
┌─────────────────────────────────┐
│      FILTRO DE KALMAN 1D        │
│  q=0.01, r=0.1, p₀=1.0         │
│  Saída: temperatura suavizada   │
└─────────────────────────────────┘
    │
    ▼
Offset de Calibração (NVS)
    │  T_final = T_kalman + offset_c
    ▼
Payload JSON via MQTT
    │  {"temp":24.82, "state":1, ...}
    ▼
Dashboard Web (React + TypeScript)
    │  Gráfico SVG em tempo real
    │  Indicadores e métricas
    ▼
Operador visualiza e toma decisões
```

---

## Parâmetros do Filtro e Ajuste Remoto

O firmware aceita comandos MQTT para recalibração, que influenciam indiretamente o filtro:

| Parâmetro | Local | Ajuste Remoto |
|-----------|-------|---------------|
| `q` (ruído do processo) | Hardcoded em `task_sensor.c` | Requer OTA (atualização de firmware) |
| `r` (ruído da medição) | Hardcoded em `task_sensor.c` | Requer OTA |
| `offset_c` (calibração) | NVS (flash) | Via MQTT `cmd/calibrate` |
| `emissivity` (ε) | NVS (flash) | Via MQTT `cmd/calibrate` |

**Tópico MQTT de calibração:** `amassadeira/{device_id}/cmd/calibrate`

```json
{
    "offset_c": 0.5,
    "emissivity": 0.95
}
```

---

## Funcionamento Detalhado do Filtro 1D

O filtro de Kalman 1D usa apenas **duas equações** (predição e atualização), diferentemente do Kalman completo que opera com matrizes.

### Estado Interno

- `x` — Estimativa atual da temperatura (°C)
- `p` — Covariância do erro da estimativa (incerteza)

### Parâmetros Fixos

- `q = 0.01` — Variância do ruído do processo. A temperatura da massa não muda abruptamente.
- `r = 0.10` — Variância do ruído da medição. Baseado no datasheet do MLX90614 (±0.5°C típico).

### Ciclo de Funcionamento

A cada 500ms:

1. **Predição (time update)**
   ```
   p = p + q
   ```
   A incerteza aumenta ligeiramente porque o sistema pode ter mudado desde a última medição.

2. **Cálculo do Ganho de Kalman**
   ```
   k = p / (p + r)
   ```
   - Se `p` é grande (incerteza alta) → `k` próximo de 1 → o filtro confia mais na nova medição
   - Se `p` é pequeno (certeza alta) → `k` próximo de 0 → o filtro confia mais na estimativa anterior
   - O ganho se ajusta automaticamente a cada ciclo

3. **Atualização (measurement update)**
   ```
   x = x + k × (z - x)
   ```
   A nova estimativa é a anterior mais uma fração da diferença entre medição e estimativa.

4. **Atualização da covariância do erro**
   ```
   p = (1 - k) × p
   ```
   A incerteza diminui após incorporar a medição.

---

## Visualização no Dashboard

O dashboard (`src/domain.ts`) recebe o campo `final_temp` já filtrado e o exibe:

```typescript
export interface TelemetrySample {
    timestamp: number;
    temperature: number;       // final_temp do firmware (já filtrado)
    ambientTemp: number;       // temperatura ambiente
    state: string;
    timeRemaining: number;
    message: string;
}
```

O gráfico SVG em `App.tsx` plota a série temporal. Como os dados já chegam filtrados, a curva aparece suave mesmo que haja ruído momentâneo no sensor IR.

---

## Por que o Kalman é Melhor que Média Móvel?

| Característica | Média Móvel (Janela N) | Kalman 1D |
|---------------|----------------------|-----------|
| Memória | Janela fixa de N amostras | Estado interno infinito (decai exponencialmente) |
| Latência | Atraso de N/2 amostras | Adaptativo: ~1-3 amostras |
| Resposta a degrau | Lenta (precisa de N amostras para refletir mudança) | Rápida (ganho alto quando erro de predição é grande) |
| Ruído | Rejeita bem com N grande, mas atrasa muito | Rejeita bem e se adapta |
| Cálculo | O(N) por amostra | O(1) — 4 operações de ponto flutuante |

---

## Referências

- Implementação no firmware: `sensor-temperatura-ir_senai/src/tasks/task_sensor.c`
- Tipos de telemetria no dashboard: `app-sensor-temperatura-ir_senai/src/domain.ts`
- Welch & Bishop, *An Introduction to the Kalman Filter*
- Melexis MLX90614 Datasheet (precisão e ruído do sensor)
