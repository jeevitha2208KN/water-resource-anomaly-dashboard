/**
 * Shared TypeScript contracts between the frontend and the planned Java / Hadoop MapReduce backend.
 * The Java backend should return JSON matching these shapes so pages work without changes.
 */

export type ReadingStatus = "normal" | "warning" | "anomaly"
export type Severity = "critical" | "high" | "medium" | "low"
export type InvestigationStatus = "open" | "acknowledged" | "resolved"
export type LocationType = "reservoir" | "treatment_plant" | "pipeline_point" | "sensor_station"
export type HealthStatus = "normal" | "warning" | "critical"

export type AnomalyType =
  | "possible_leakage"
  | "abnormal_flow"
  | "pressure_drop"
  | "unusual_reservoir_level"
  | "abnormal_consumption"
  | "quality_variation"

export type ReadingMetric = "flowRate" | "pressure" | "waterLevel" | "ph" | "turbidity"

export interface SensorReading {
  id: string
  sensorId: string
  locationId: string
  locationName: string
  timestamp: string
  /** Litres per hour */
  flowRate: number
  /** bar */
  pressure: number
  /** Percentage of capacity, 0-100 */
  waterLevel: number
  ph: number
  /** NTU */
  turbidity: number
  status: ReadingStatus
}

export interface MonitoringLocation {
  id: string
  name: string
  type: LocationType
  zone: string
  latitude: number
  longitude: number
  sensorIds: string[]
  status: HealthStatus
  latest: {
    sensorId: string
    timestamp: string
    flowRate: number
    pressure: number
    waterLevel: number
  }
  openAnomalies: number
}

export interface Anomaly {
  id: string
  sensorId: string
  locationId: string
  locationName: string
  type: AnomalyType
  metric: ReadingMetric
  observedValue: number
  baselineValue: number
  unit: string
  /** Normalised anomaly score 0-1 produced by the MapReduce reducer */
  score: number
  severity: Severity
  detectedAt: string
  status: InvestigationStatus
  description: string
  jobId: string
}

export interface AnomalyDetail extends Anomaly {
  history: { timestamp: string; value: number }[]
  baselineMean: number
  baselineStdDev: number
  notes: { at: string; author: string; text: string }[]
}

export interface Reservoir {
  id: string
  name: string
  locationId: string
  zone: string
  /** Megalitres */
  capacityMl: number
  currentLevelPct: number
  minSafePct: number
  maxSafePct: number
  inflowMlPerDay: number
  outflowMlPerDay: number
  status: "normal" | "low" | "high" | "critical"
  history: { date: string; levelPct: number }[]
}

export interface DashboardSummary {
  totalLocations: number
  totalReadings: number
  normalReadings: number
  anomaliesDetected: number
  possibleLeakageAlerts: number
  reservoirsRequiringAttention: number
  datasetRange: { from: string; to: string }
  lastJobId: string | null
}

export interface DailyPoint {
  date: string
  consumptionKl: number
  avgFlowRate: number
  avgPressure: number
  normalReadings: number
  anomalies: number
}

export interface AnalyticsResponse {
  daily: DailyPoint[]
  weekly: { week: string; consumptionKl: number; anomalies: number }[]
  monthly: { month: string; consumptionKl: number; anomalies: number }[]
  byLocation: {
    locationId: string
    locationName: string
    consumptionKl: number
    avgFlowRate: number
    avgPressure: number
    anomalies: number
  }[]
  anomaliesByType: { type: AnomalyType; count: number }[]
  anomaliesBySeverity: { severity: Severity; count: number }[]
  reservoirLevels: { date: string; [reservoirId: string]: number | string }[]
}

export type JobStatus = "PREP" | "RUNNING" | "SUCCEEDED" | "FAILED" | "KILLED"

export interface MapReduceJob {
  id: string
  name: string
  status: JobStatus
  inputPath: string
  outputPath: string
  submittedAt: string
  startedAt: string | null
  finishedAt: string | null
  mapProgress: number
  reduceProgress: number
  mapTasks: number
  reduceTasks: number
  recordsIn: number
  recordsOut: number
  anomaliesFound: number
  errorMessage?: string
  counters?: Record<string, number>
}

export interface DatasetUploadResponse {
  datasetId: string
  fileName: string
  records: number
  hdfsPath: string
  jobId: string | null
  status: "accepted" | "rejected"
  errors?: string[]
}

export type AlertCategory = "critical" | "leakage" | "low_reservoir" | "sensor" | "job_failure"

export interface SystemAlert {
  id: string
  category: AlertCategory
  severity: Severity
  title: string
  message: string
  source: string
  createdAt: string
  status: InvestigationStatus
  href?: string
}
