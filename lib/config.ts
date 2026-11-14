export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "")

/** Demo mode is active whenever no backend URL is configured. */
export const IS_DEMO_MODE = API_BASE_URL.length === 0

export const API_ENDPOINTS = {
  dashboardSummary: "/api/dashboard/summary",
  readings: "/api/monitoring/readings",
  anomalies: "/api/anomalies",
  anomaly: (id: string) => `/api/anomalies/${encodeURIComponent(id)}`,
  locations: "/api/locations",
  reservoirs: "/api/reservoirs",
  analytics: "/api/analytics",
  datasetUpload: "/api/datasets/upload",
  jobs: "/api/mapreduce/jobs",
  job: (id: string) => `/api/mapreduce/jobs/${encodeURIComponent(id)}`,
  alerts: "/api/alerts",
} as const

export const CSV_COLUMNS = [
  "timestamp",
  "location",
  "sensor_id",
  "flow_rate",
  "pressure",
  "water_level",
  "ph",
  "turbidity",
] as const
