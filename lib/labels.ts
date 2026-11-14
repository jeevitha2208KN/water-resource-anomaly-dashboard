import type { AnomalyType, LocationType, ReadingMetric, Severity } from "./types"

export const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  possible_leakage: "Possible water leakage",
  abnormal_flow: "Abnormal water flow",
  pressure_drop: "Sudden pressure drop",
  unusual_reservoir_level: "Unusual reservoir level",
  abnormal_consumption: "Abnormal water consumption",
  quality_variation: "Water quality variation",
}

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  reservoir: "Reservoir",
  treatment_plant: "Treatment plant",
  pipeline_point: "Pipeline monitoring point",
  sensor_station: "Sensor station",
}

export const METRIC_LABELS: Record<ReadingMetric, { label: string; unit: string }> = {
  flowRate: { label: "Flow rate", unit: "L/hr" },
  pressure: { label: "Pipeline pressure", unit: "bar" },
  waterLevel: { label: "Water level", unit: "%" },
  ph: { label: "pH", unit: "" },
  turbidity: { label: "Turbidity", unit: "NTU" },
}

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"]

export const CHART_COLORS = {
  navy: "#1e3a6e",
  blue: "#2f7fc1",
  cyan: "#22b8cf",
  teal: "#5fd0d8",
  green: "#1fa971",
  orange: "#f08c2e",
  red: "#e03e3e",
  slate: "#94a3b8",
  grid: "#e6ebf2",
} as const

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: CHART_COLORS.red,
  high: CHART_COLORS.orange,
  medium: "#f2c14e",
  low: CHART_COLORS.blue,
}
