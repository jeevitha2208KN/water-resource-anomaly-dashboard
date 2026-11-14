/**
 * DEMO DATA GENERATOR
 * Produces a deterministic, historical sample dataset so the UI can be demonstrated
 * before the Java / Hadoop MapReduce backend is connected. Nothing here is real sensor data,
 * and none of the anomaly detection logic here stands in for the MapReduce job:
 * anomalies are pre-injected into the sample readings.
 */
import type {
  Anomaly,
  AnomalyType,
  LocationType,
  MapReduceJob,
  ReadingMetric,
  Reservoir,
  SensorReading,
  Severity,
  SystemAlert,
} from "../types"

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20261113)
const gaussian = () => {
  const u = 1 - rand()
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d

export const DATASET_START = Date.UTC(2026, 9, 15, 0, 0, 0)
export const DATASET_DAYS = 30
const STEP_HOURS = 6
const STEPS = (DATASET_DAYS * 24) / STEP_HOURS
export const DATASET_END = DATASET_START + (STEPS - 1) * STEP_HOURS * 3600_000

interface LocationSeed {
  id: string
  name: string
  type: LocationType
  zone: string
  latitude: number
  longitude: number
  reservoirIndex: number
  sensors: { id: string; flow: number; pressure: number }[]
}

/** Demonstration coordinates only. They are illustrative and do not represent real infrastructure. */
export const LOCATION_SEEDS: LocationSeed[] = [
  { id: "LOC-01", name: "North Reservoir (Demo)", type: "reservoir", zone: "North Zone", latitude: 13.062, longitude: 77.585, reservoirIndex: 0, sensors: [{ id: "SNS-101", flow: 42000, pressure: 3.8 }] },
  { id: "LOC-02", name: "East Reservoir (Demo)", type: "reservoir", zone: "East Zone", latitude: 12.985, longitude: 77.682, reservoirIndex: 1, sensors: [{ id: "SNS-102", flow: 38000, pressure: 3.6 }] },
  { id: "LOC-03", name: "South Reservoir (Demo)", type: "reservoir", zone: "South Zone", latitude: 12.894, longitude: 77.598, reservoirIndex: 2, sensors: [{ id: "SNS-103", flow: 35000, pressure: 3.5 }] },
  { id: "LOC-04", name: "West Reservoir (Demo)", type: "reservoir", zone: "West Zone", latitude: 12.972, longitude: 77.498, reservoirIndex: 3, sensors: [{ id: "SNS-104", flow: 31000, pressure: 3.4 }] },
  { id: "LOC-05", name: "Treatment Plant Alpha (Demo)", type: "treatment_plant", zone: "North Zone", latitude: 13.031, longitude: 77.552, reservoirIndex: 0, sensors: [{ id: "SNS-201", flow: 52000, pressure: 4.2 }, { id: "SNS-202", flow: 47000, pressure: 4.0 }] },
  { id: "LOC-06", name: "Treatment Plant Beta (Demo)", type: "treatment_plant", zone: "South Zone", latitude: 12.918, longitude: 77.645, reservoirIndex: 2, sensors: [{ id: "SNS-203", flow: 49000, pressure: 4.1 }] },
  { id: "LOC-07", name: "Pipeline Point P-07 (Demo)", type: "pipeline_point", zone: "Central Zone", latitude: 12.995, longitude: 77.61, reservoirIndex: 0, sensors: [{ id: "SNS-301", flow: 18500, pressure: 3.1 }] },
  { id: "LOC-08", name: "Pipeline Point P-12 (Demo)", type: "pipeline_point", zone: "East Zone", latitude: 12.958, longitude: 77.655, reservoirIndex: 1, sensors: [{ id: "SNS-302", flow: 16200, pressure: 2.9 }] },
  { id: "LOC-09", name: "Pipeline Point P-19 (Demo)", type: "pipeline_point", zone: "South Zone", latitude: 12.931, longitude: 77.574, reservoirIndex: 2, sensors: [{ id: "SNS-303", flow: 14800, pressure: 2.8 }] },
  { id: "LOC-10", name: "Pipeline Point P-23 (Demo)", type: "pipeline_point", zone: "West Zone", latitude: 12.948, longitude: 77.531, reservoirIndex: 3, sensors: [{ id: "SNS-304", flow: 13900, pressure: 2.7 }] },
  { id: "LOC-11", name: "Central Sensor Station (Demo)", type: "sensor_station", zone: "Central Zone", latitude: 12.972, longitude: 77.594, reservoirIndex: 0, sensors: [{ id: "SNS-401", flow: 22500, pressure: 3.3 }] },
  { id: "LOC-12", name: "West Sensor Station (Demo)", type: "sensor_station", zone: "West Zone", latitude: 13.008, longitude: 77.512, reservoirIndex: 3, sensors: [{ id: "SNS-402", flow: 20800, pressure: 3.2 }] },
]

const RESERVOIR_SEEDS = [
  { id: "RSV-N", locationId: "LOC-01", capacityMl: 1850, start: 72, drift: -0.15, minSafe: 30, maxSafe: 90 },
  { id: "RSV-E", locationId: "LOC-02", capacityMl: 1240, start: 81, drift: 0.42, minSafe: 30, maxSafe: 90 },
  { id: "RSV-S", locationId: "LOC-03", capacityMl: 960, start: 47, drift: -0.95, minSafe: 30, maxSafe: 90 },
  { id: "RSV-W", locationId: "LOC-04", capacityMl: 1420, start: 63, drift: 0.05, minSafe: 30, maxSafe: 90 },
]

const reservoirDaily: number[][] = RESERVOIR_SEEDS.map((r) => {
  const series: number[] = []
  let level = r.start
  for (let d = 0; d < DATASET_DAYS; d++) {
    level = Math.min(99, Math.max(5, level + r.drift + gaussian() * 0.6))
    series.push(round(level, 1))
  }
  return series
})

interface Injection {
  sensorId: string
  step: number
  type: AnomalyType
}

const INJECTIONS: Injection[] = [
  { sensorId: "SNS-301", step: 112, type: "possible_leakage" },
  { sensorId: "SNS-302", step: 104, type: "pressure_drop" },
  { sensorId: "SNS-303", step: 118, type: "possible_leakage" },
  { sensorId: "SNS-103", step: 115, type: "unusual_reservoir_level" },
  { sensorId: "SNS-201", step: 109, type: "quality_variation" },
  { sensorId: "SNS-401", step: 117, type: "abnormal_consumption" },
  { sensorId: "SNS-304", step: 100, type: "abnormal_flow" },
  { sensorId: "SNS-102", step: 111, type: "unusual_reservoir_level" },
  { sensorId: "SNS-402", step: 96, type: "abnormal_consumption" },
  { sensorId: "SNS-203", step: 92, type: "quality_variation" },
  { sensorId: "SNS-301", step: 86, type: "pressure_drop" },
  { sensorId: "SNS-202", step: 80, type: "abnormal_flow" },
  { sensorId: "SNS-302", step: 74, type: "possible_leakage" },
  { sensorId: "SNS-104", step: 68, type: "abnormal_flow" },
  { sensorId: "SNS-303", step: 61, type: "pressure_drop" },
  { sensorId: "SNS-401", step: 55, type: "abnormal_flow" },
  { sensorId: "SNS-101", step: 49, type: "abnormal_consumption" },
  { sensorId: "SNS-201", step: 43, type: "quality_variation" },
  { sensorId: "SNS-304", step: 37, type: "possible_leakage" },
  { sensorId: "SNS-402", step: 30, type: "pressure_drop" },
  { sensorId: "SNS-203", step: 24, type: "abnormal_flow" },
  { sensorId: "SNS-102", step: 19, type: "abnormal_consumption" },
  { sensorId: "SNS-302", step: 13, type: "quality_variation" },
  { sensorId: "SNS-103", step: 8, type: "abnormal_flow" },
  { sensorId: "SNS-301", step: 120 - 2, type: "abnormal_flow" },
  { sensorId: "SNS-202", step: 114, type: "pressure_drop" },
]

const METRIC_FOR_TYPE: Record<AnomalyType, ReadingMetric> = {
  possible_leakage: "flowRate",
  abnormal_flow: "flowRate",
  pressure_drop: "pressure",
  unusual_reservoir_level: "waterLevel",
  abnormal_consumption: "flowRate",
  quality_variation: "turbidity",
}

const UNIT: Record<ReadingMetric, string> = {
  flowRate: "L/hr",
  pressure: "bar",
  waterLevel: "%",
  ph: "pH",
  turbidity: "NTU",
}

function applyInjection(r: SensorReading, type: AnomalyType, magnitude: number) {
  switch (type) {
    case "possible_leakage":
      r.flowRate *= 1.55 + magnitude * 0.4
      r.pressure *= 0.68 - magnitude * 0.1
      break
    case "abnormal_flow":
      r.flowRate *= magnitude > 0.5 ? 1.7 + magnitude * 0.3 : 0.35
      break
    case "pressure_drop":
      r.pressure *= 0.42 + (1 - magnitude) * 0.15
      break
    case "unusual_reservoir_level":
      r.waterLevel = magnitude > 0.5 ? Math.max(4, r.waterLevel - 22) : Math.min(99, r.waterLevel + 14)
      break
    case "abnormal_consumption":
      r.flowRate *= 2.05 + magnitude * 0.35
      break
    case "quality_variation":
      r.turbidity *= 4.5 + magnitude * 2
      r.ph += magnitude > 0.5 ? 1.3 : -1.1
      break
  }
}

function buildReadings() {
  const readings: SensorReading[] = []
  for (const loc of LOCATION_SEEDS) {
    for (const s of loc.sensors) {
      const basePh = 7.2 + gaussian() * 0.15
      const baseTurb = loc.type === "treatment_plant" ? 0.6 : 1.8
      for (let step = 0; step < STEPS; step++) {
        const ts = DATASET_START + step * STEP_HOURS * 3600_000
        const hour = new Date(ts).getUTCHours()
        const diurnal = 1 + 0.22 * Math.sin(((hour - 6) / 24) * 2 * Math.PI)
        const day = Math.floor(step / (24 / STEP_HOURS))
        readings.push({
          id: `${s.id}-${step.toString().padStart(4, "0")}`,
          sensorId: s.id,
          locationId: loc.id,
          locationName: loc.name,
          timestamp: new Date(ts).toISOString(),
          flowRate: s.flow * diurnal * (1 + gaussian() * 0.045),
          pressure: s.pressure * (1 - (diurnal - 1) * 0.25) * (1 + gaussian() * 0.03),
          waterLevel: reservoirDaily[loc.reservoirIndex][day] + gaussian() * 0.4,
          ph: basePh + gaussian() * 0.08,
          turbidity: Math.max(0.1, baseTurb * (1 + gaussian() * 0.12)),
          status: "normal",
        })
      }
    }
  }
  return readings
}

const readings = buildReadings()

const bySensor = new Map<string, SensorReading[]>()
for (const r of readings) {
  const list = bySensor.get(r.sensorId) ?? []
  list.push(r)
  bySensor.set(r.sensorId, list)
}

function stats(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  return { mean, std: Math.sqrt(variance) }
}

const baselines = new Map<string, Record<ReadingMetric, { mean: number; std: number }>>()
for (const [sensorId, list] of bySensor) {
  baselines.set(sensorId, {
    flowRate: stats(list.map((r) => r.flowRate)),
    pressure: stats(list.map((r) => r.pressure)),
    waterLevel: stats(list.map((r) => r.waterLevel)),
    ph: stats(list.map((r) => r.ph)),
    turbidity: stats(list.map((r) => r.turbidity)),
  })
}

const injectedIds = new Set<string>()
const anomalies: Anomaly[] = INJECTIONS.map((inj, i) => {
  const list = bySensor.get(inj.sensorId)!
  const reading = list[inj.step]
  const magnitude = rand()
  applyInjection(reading, inj.type, magnitude)
  injectedIds.add(reading.id)
  reading.status = "anomaly"
  const metric = METRIC_FOR_TYPE[inj.type]
  const base = baselines.get(inj.sensorId)![metric]
  const observed = reading[metric]
  const z = Math.abs(observed - base.mean) / Math.max(base.std, 1e-6)
  const score = round(Math.min(0.99, 0.35 + z / 22), 2)
  const severity: Severity = score >= 0.85 ? "critical" : score >= 0.7 ? "high" : score >= 0.55 ? "medium" : "low"
  const age = STEPS - inj.step
  const status = age > 60 ? "resolved" : age > 18 ? "acknowledged" : "open"
  const metricLabel = metric === "flowRate" ? "flow rate" : metric === "waterLevel" ? "water level" : metric
  return {
    id: `ANM-2026-${(1000 + INJECTIONS.length - i).toString()}`,
    sensorId: inj.sensorId,
    locationId: reading.locationId,
    locationName: reading.locationName,
    type: inj.type,
    metric,
    observedValue: round(observed, metric === "flowRate" ? 0 : 2),
    baselineValue: round(base.mean, metric === "flowRate" ? 0 : 2),
    unit: UNIT[metric],
    score,
    severity,
    detectedAt: reading.timestamp,
    status,
    description: `Observed ${metricLabel} deviates ${z.toFixed(1)}σ from the sensor baseline. This is a possible issue that requires field investigation; it does not confirm a physical fault.`,
    jobId: `job_demo_${(Math.floor(inj.step / 24) + 1).toString().padStart(3, "0")}`,
  } satisfies Anomaly
}).sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))

for (const r of readings) {
  if (injectedIds.has(r.id)) continue
  const b = baselines.get(r.sensorId)!
  const maxZ = Math.max(
    Math.abs(r.flowRate - b.flowRate.mean) / b.flowRate.std,
    Math.abs(r.pressure - b.pressure.mean) / b.pressure.std,
    Math.abs(r.turbidity - b.turbidity.mean) / b.turbidity.std,
  )
  if (maxZ > 2.6) r.status = "warning"
}

for (const r of readings) {
  r.flowRate = round(r.flowRate, 0)
  r.pressure = round(r.pressure, 2)
  r.waterLevel = round(r.waterLevel, 1)
  r.ph = round(r.ph, 2)
  r.turbidity = round(r.turbidity, 2)
}

const reservoirs: Reservoir[] = RESERVOIR_SEEDS.map((seed, i) => {
  const loc = LOCATION_SEEDS.find((l) => l.id === seed.locationId)!
  const series = reservoirDaily[i]
  const current = series[series.length - 1]
  const status: Reservoir["status"] =
    current < 20 ? "critical" : current < seed.minSafe ? "low" : current > seed.maxSafe ? "high" : "normal"
  return {
    id: seed.id,
    name: loc.name,
    locationId: loc.id,
    zone: loc.zone,
    capacityMl: seed.capacityMl,
    currentLevelPct: current,
    minSafePct: seed.minSafe,
    maxSafePct: seed.maxSafe,
    inflowMlPerDay: round(seed.capacityMl * (0.035 + seed.drift / 100), 1),
    outflowMlPerDay: round(seed.capacityMl * 0.035, 1),
    status,
    history: series.map((levelPct, d) => ({
      date: new Date(DATASET_START + d * 86400_000).toISOString().slice(0, 10),
      levelPct,
    })),
  }
})

const jobs: MapReduceJob[] = [
  { id: "job_demo_005", name: "AnomalyDetection-Daily", status: "SUCCEEDED", inputPath: "/water/raw/2026-11-13", outputPath: "/water/anomalies/2026-11-13", submittedAt: "2026-11-13T19:00:00Z", startedAt: "2026-11-13T19:00:14Z", finishedAt: "2026-11-13T19:04:52Z", mapProgress: 100, reduceProgress: 100, mapTasks: 24, reduceTasks: 6, recordsIn: 1440, recordsOut: 13, anomaliesFound: 9, counters: { MAP_INPUT_RECORDS: 1440, MAP_OUTPUT_RECORDS: 1440, REDUCE_INPUT_GROUPS: 13, REDUCE_OUTPUT_RECORDS: 13, MALFORMED_RECORDS: 0 } },
  { id: "job_demo_004", name: "AnomalyDetection-Daily", status: "FAILED", inputPath: "/water/raw/2026-11-08", outputPath: "/water/anomalies/2026-11-08", submittedAt: "2026-11-08T19:00:00Z", startedAt: "2026-11-08T19:00:11Z", finishedAt: "2026-11-08T19:01:37Z", mapProgress: 62, reduceProgress: 0, mapTasks: 24, reduceTasks: 6, recordsIn: 893, recordsOut: 0, anomaliesFound: 0, errorMessage: "Task attempt_demo_m_000017 failed: NumberFormatException parsing column 'pressure' (value: 'N/A').", counters: { MAP_INPUT_RECORDS: 893, MALFORMED_RECORDS: 41 } },
  { id: "job_demo_003", name: "AnomalyDetection-Daily", status: "SUCCEEDED", inputPath: "/water/raw/2026-11-01", outputPath: "/water/anomalies/2026-11-01", submittedAt: "2026-11-01T19:00:00Z", startedAt: "2026-11-01T19:00:09Z", finishedAt: "2026-11-01T19:04:21Z", mapProgress: 100, reduceProgress: 100, mapTasks: 24, reduceTasks: 6, recordsIn: 1440, recordsOut: 13, anomaliesFound: 7, counters: { MAP_INPUT_RECORDS: 1440, MAP_OUTPUT_RECORDS: 1440, REDUCE_INPUT_GROUPS: 13, REDUCE_OUTPUT_RECORDS: 13, MALFORMED_RECORDS: 0 } },
  { id: "job_demo_002", name: "Consumption-Aggregation", status: "SUCCEEDED", inputPath: "/water/raw/2026-10", outputPath: "/water/aggregates/2026-10", submittedAt: "2026-10-31T23:30:00Z", startedAt: "2026-10-31T23:30:12Z", finishedAt: "2026-10-31T23:41:03Z", mapProgress: 100, reduceProgress: 100, mapTasks: 48, reduceTasks: 12, recordsIn: 816, recordsOut: 204, anomaliesFound: 0, counters: { MAP_INPUT_RECORDS: 816, REDUCE_OUTPUT_RECORDS: 204, MALFORMED_RECORDS: 0 } },
  { id: "job_demo_001", name: "AnomalyDetection-Daily", status: "KILLED", inputPath: "/water/raw/2026-10-20", outputPath: "/water/anomalies/2026-10-20", submittedAt: "2026-10-20T19:00:00Z", startedAt: "2026-10-20T19:00:10Z", finishedAt: "2026-10-20T19:02:05Z", mapProgress: 40, reduceProgress: 0, mapTasks: 24, reduceTasks: 6, recordsIn: 576, recordsOut: 0, anomaliesFound: 0, errorMessage: "Job killed by user (demo record).", counters: { MAP_INPUT_RECORDS: 576 } },
]

function buildAlerts(): SystemAlert[] {
  const list: SystemAlert[] = []
  for (const a of anomalies) {
    if (a.severity === "low") continue
    const isLeak = a.type === "possible_leakage"
    list.push({
      id: `ALT-${a.id.slice(-4)}`,
      category: isLeak ? "leakage" : a.severity === "critical" ? "critical" : "sensor",
      severity: a.severity,
      title: isLeak
        ? `Possible leakage at ${a.locationName}`
        : a.severity === "critical"
          ? `Critical reading at ${a.locationName}`
          : `Abnormal sensor reading on ${a.sensorId}`,
      message: `${a.sensorId} reported ${a.observedValue.toLocaleString()} ${a.unit} against a baseline of ${a.baselineValue.toLocaleString()} ${a.unit}. Investigation recommended.`,
      source: a.sensorId,
      createdAt: a.detectedAt,
      status: a.status,
      href: `/anomalies/${a.id}`,
    })
  }
  for (const r of reservoirs) {
    if (r.status === "normal") continue
    list.push({
      id: `ALT-${r.id}`,
      category: "low_reservoir",
      severity: r.status === "critical" ? "critical" : r.status === "low" ? "high" : "medium",
      title: r.status === "high" ? `High level at ${r.name}` : `Low reservoir level at ${r.name}`,
      message: `Level at ${r.currentLevelPct}% (safe band ${r.minSafePct}-${r.maxSafePct}%).`,
      source: r.id,
      createdAt: new Date(DATASET_END).toISOString(),
      status: "open",
      href: "/reservoirs",
    })
  }
  for (const j of jobs) {
    if (j.status !== "FAILED") continue
    list.push({
      id: `ALT-${j.id}`,
      category: "job_failure",
      severity: "high",
      title: `MapReduce job ${j.id} failed`,
      message: j.errorMessage ?? "Job failed.",
      source: j.id,
      createdAt: j.finishedAt ?? j.submittedAt,
      status: "acknowledged",
      href: "/datasets",
    })
  }
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const demoDataset = {
  readings,
  anomalies,
  reservoirs,
  jobs,
  alerts: buildAlerts(),
  baselines,
  bySensor,
}
