import type { Anomaly, SensorReading } from "./types"

export type RangeKey = "7" | "14" | "30"
export const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days of dataset" },
  { value: "14", label: "Last 14 days of dataset" },
  { value: "30", label: "Full dataset (30 days)" },
]

const DAY = 86_400_000

/** Range is relative to the newest record in the dataset, never to the wall clock. */
export function rangeStart(readings: SensorReading[], days: number) {
  if (readings.length === 0) return 0
  const latest = readings.reduce((m, r) => Math.max(m, Date.parse(r.timestamp)), 0)
  const endOfDay = Math.floor(latest / DAY) * DAY + DAY
  return endOfDay - days * DAY
}

export function filterReadings(readings: SensorReading[], days: number, locationId: string) {
  const start = rangeStart(readings, days)
  return readings.filter((r) => Date.parse(r.timestamp) >= start && (locationId === "all" || r.locationId === locationId))
}

export function filterAnomalies(anomalies: Anomaly[], readings: SensorReading[], days: number, locationId: string) {
  const start = rangeStart(readings, days)
  return anomalies.filter((a) => Date.parse(a.detectedAt) >= start && (locationId === "all" || a.locationId === locationId))
}

function stepHours(readings: SensorReading[]) {
  const first = readings[0]
  if (!first) return 1
  const next = readings.find((r) => r.sensorId === first.sensorId && r.timestamp !== first.timestamp)
  return next ? Math.abs(Date.parse(next.timestamp) - Date.parse(first.timestamp)) / 3_600_000 : 1
}

export interface DailyAggregate {
  date: string
  consumptionKl: number
  avgFlow: number
  avgPressure: number
  avgLevel: number
  normal: number
  warning: number
  anomaly: number
}

export function dailyAggregates(readings: SensorReading[]): DailyAggregate[] {
  const hours = stepHours(readings)
  const map = new Map<string, { sumFlow: number; sumP: number; sumL: number; n: number; normal: number; warning: number; anomaly: number }>()
  for (const r of readings) {
    const day = r.timestamp.slice(0, 10)
    const e = map.get(day) ?? { sumFlow: 0, sumP: 0, sumL: 0, n: 0, normal: 0, warning: 0, anomaly: 0 }
    e.sumFlow += r.flowRate
    e.sumP += r.pressure
    e.sumL += r.waterLevel
    e.n += 1
    e[r.status] += 1
    map.set(day, e)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, e]) => ({
      date: `${date}T00:00:00.000Z`,
      consumptionKl: Math.round((e.sumFlow * hours) / 1000),
      avgFlow: Math.round(e.sumFlow / e.n),
      avgPressure: Number((e.sumP / e.n).toFixed(2)),
      avgLevel: Number((e.sumL / e.n).toFixed(1)),
      normal: e.normal,
      warning: e.warning,
      anomaly: e.anomaly,
    }))
}

export function locationAggregates(readings: SensorReading[]) {
  const hours = stepHours(readings)
  const map = new Map<string, { name: string; sumFlow: number; sumP: number; n: number; abnormal: number }>()
  for (const r of readings) {
    const e = map.get(r.locationId) ?? { name: r.locationName, sumFlow: 0, sumP: 0, n: 0, abnormal: 0 }
    e.sumFlow += r.flowRate
    e.sumP += r.pressure
    e.n += 1
    if (r.status !== "normal") e.abnormal += 1
    map.set(r.locationId, e)
  }
  return [...map.entries()]
    .map(([locationId, e]) => ({
      locationId,
      locationName: e.name,
      consumptionKl: Math.round((e.sumFlow * hours) / 1000),
      avgFlow: Math.round(e.sumFlow / e.n),
      avgPressure: Number((e.sumP / e.n).toFixed(2)),
      readings: e.n,
      abnormal: e.abnormal,
    }))
    .sort((a, b) => b.consumptionKl - a.consumptionKl)
}

export function weeklyFromDaily(daily: DailyAggregate[]) {
  const weeks: { week: string; consumptionKl: number; anomaly: number; days: number }[] = []
  daily.forEach((d, i) => {
    const w = Math.floor(i / 7)
    if (!weeks[w]) weeks[w] = { week: d.date, consumptionKl: 0, anomaly: 0, days: 0 }
    weeks[w].consumptionKl += d.consumptionKl
    weeks[w].anomaly += d.anomaly
    weeks[w].days += 1
  })
  return weeks
}

export function monthlyFromDaily(daily: DailyAggregate[]) {
  const map = new Map<string, { consumptionKl: number; anomaly: number; days: number }>()
  for (const d of daily) {
    const m = d.date.slice(0, 7)
    const e = map.get(m) ?? { consumptionKl: 0, anomaly: 0, days: 0 }
    e.consumptionKl += d.consumptionKl
    e.anomaly += d.anomaly
    e.days += 1
    map.set(m, e)
  }
  return [...map.entries()].map(([month, e]) => ({ month, ...e }))
}

export const shortName = (name: string) => name.replace(" (Demo)", "")
