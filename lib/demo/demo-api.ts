/**
 * DEMO DATA responders. Each function mirrors one planned backend endpoint and returns the
 * same TypeScript shape the Java backend is expected to return.
 */
import type {
  AnalyticsResponse,
  Anomaly,
  AnomalyDetail,
  DashboardSummary,
  InvestigationStatus,
  MonitoringLocation,
  SystemAlert,
} from "../types"
import { DATASET_END, DATASET_START, LOCATION_SEEDS, demoDataset } from "./dataset"

const anomalyState = new Map<string, InvestigationStatus>()
const alertState = new Map<string, InvestigationStatus>()
const notes = new Map<string, AnomalyDetail["notes"]>()

const currentAnomalies = (): Anomaly[] =>
  demoDataset.anomalies.map((a) => ({ ...a, status: anomalyState.get(a.id) ?? a.status }))

export const demoApi = {
  summary(): DashboardSummary {
    const { readings, reservoirs } = demoDataset
    const anomalies = currentAnomalies()
    return {
      totalLocations: LOCATION_SEEDS.length,
      totalReadings: readings.length,
      normalReadings: readings.filter((r) => r.status === "normal").length,
      anomaliesDetected: anomalies.length,
      possibleLeakageAlerts: anomalies.filter((a) => a.type === "possible_leakage" && a.status !== "resolved").length,
      reservoirsRequiringAttention: reservoirs.filter((r) => r.status !== "normal").length,
      datasetRange: { from: new Date(DATASET_START).toISOString(), to: new Date(DATASET_END).toISOString() },
      lastJobId: demoDataset.jobs[0]?.id ?? null,
    }
  },

  readings() {
    return demoDataset.readings
  },

  anomalies() {
    return currentAnomalies()
  },

  anomaly(id: string): AnomalyDetail | null {
    const a = currentAnomalies().find((x) => x.id === id)
    if (!a) return null
    const list = demoDataset.bySensor.get(a.sensorId) ?? []
    const idx = list.findIndex((r) => r.timestamp === a.detectedAt)
    const window = list.slice(Math.max(0, idx - 28), Math.min(list.length, idx + 8))
    const base = demoDataset.baselines.get(a.sensorId)![a.metric]
    return {
      ...a,
      history: window.map((r) => ({ timestamp: r.timestamp, value: r[a.metric] })),
      baselineMean: Number(base.mean.toFixed(2)),
      baselineStdDev: Number(base.std.toFixed(2)),
      notes: notes.get(id) ?? [
        { at: a.detectedAt, author: "MapReduce job " + a.jobId, text: "Flagged by reducer: deviation exceeds configured threshold." },
      ],
    }
  },

  updateAnomalyStatus(id: string, status: InvestigationStatus) {
    anomalyState.set(id, status)
    const existing = notes.get(id) ?? demoApi.anomaly(id)?.notes ?? []
    notes.set(id, [
      ...existing,
      { at: new Date().toISOString(), author: "Operator (demo session)", text: `Status changed to ${status}.` },
    ])
    const linked = demoDataset.alerts.find((al) => al.href === `/anomalies/${id}`)
    if (linked) alertState.set(linked.id, status)
  },

  locations(): MonitoringLocation[] {
    const anomalies = currentAnomalies()
    return LOCATION_SEEDS.map((loc) => {
      const open = anomalies.filter((a) => a.locationId === loc.id && a.status !== "resolved")
      const reservoir = demoDataset.reservoirs.find((r) => r.locationId === loc.id)
      const hasSevere = open.some((a) => a.severity === "critical" || a.severity === "high")
      const status = hasSevere || reservoir?.status === "critical" ? "critical" : open.length > 0 || (reservoir && reservoir.status !== "normal") ? "warning" : "normal"
      const sensorId = loc.sensors[0].id
      const list = demoDataset.bySensor.get(sensorId)!
      const last = list[list.length - 1]
      return {
        id: loc.id,
        name: loc.name,
        type: loc.type,
        zone: loc.zone,
        latitude: loc.latitude,
        longitude: loc.longitude,
        sensorIds: loc.sensors.map((s) => s.id),
        status,
        latest: {
          sensorId,
          timestamp: last.timestamp,
          flowRate: last.flowRate,
          pressure: last.pressure,
          waterLevel: last.waterLevel,
        },
        openAnomalies: open.length,
      }
    })
  },

  reservoirs() {
    return demoDataset.reservoirs
  },

  analytics(): AnalyticsResponse {
    const { readings, reservoirs } = demoDataset
    const anomalies = currentAnomalies()
    const days = new Map<string, { flow: number[]; pressure: number[]; normal: number; anomalies: number; consumption: number }>()
    for (const r of readings) {
      const d = r.timestamp.slice(0, 10)
      const e = days.get(d) ?? { flow: [], pressure: [], normal: 0, anomalies: 0, consumption: 0 }
      e.flow.push(r.flowRate)
      e.pressure.push(r.pressure)
      e.consumption += (r.flowRate * 6) / 1000
      if (r.status === "normal") e.normal++
      if (r.status === "anomaly") e.anomalies++
      days.set(d, e)
    }
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    const daily = [...days.entries()].map(([date, e]) => ({
      date,
      consumptionKl: Math.round(e.consumption),
      avgFlowRate: Math.round(avg(e.flow)),
      avgPressure: Number(avg(e.pressure).toFixed(2)),
      normalReadings: e.normal,
      anomalies: e.anomalies,
    }))

    const weekly = []
    for (let i = 0; i < daily.length; i += 7) {
      const chunk = daily.slice(i, i + 7)
      weekly.push({
        week: `Week of ${chunk[0].date}`,
        consumptionKl: chunk.reduce((s, d) => s + d.consumptionKl, 0),
        anomalies: chunk.reduce((s, d) => s + d.anomalies, 0),
      })
    }

    const monthNames = ["Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026", "Nov 2026"]
    const monthlyBase = daily.reduce((s, d) => s + d.consumptionKl, 0)
    const monthly = monthNames.map((month, i) => ({
      month,
      consumptionKl: Math.round(monthlyBase * (0.88 + 0.16 * Math.sin(((i + 2) / 12) * 2 * Math.PI)) * (i === 11 ? 0.45 : 1)),
      anomalies: [11, 9, 8, 12, 15, 18, 14, 10, 13, 16, 19, 12][i],
    }))

    const byLocation = LOCATION_SEEDS.map((loc) => {
      const rs = readings.filter((r) => r.locationId === loc.id)
      return {
        locationId: loc.id,
        locationName: loc.name,
        consumptionKl: Math.round(rs.reduce((s, r) => s + (r.flowRate * 6) / 1000, 0)),
        avgFlowRate: Math.round(avg(rs.map((r) => r.flowRate))),
        avgPressure: Number(avg(rs.map((r) => r.pressure)).toFixed(2)),
        anomalies: anomalies.filter((a) => a.locationId === loc.id).length,
      }
    })

    const types = [...new Set(anomalies.map((a) => a.type))]
    return {
      daily,
      weekly,
      monthly,
      byLocation,
      anomaliesByType: types.map((type) => ({ type, count: anomalies.filter((a) => a.type === type).length })),
      anomaliesBySeverity: (["critical", "high", "medium", "low"] as const).map((severity) => ({
        severity,
        count: anomalies.filter((a) => a.severity === severity).length,
      })),
      reservoirLevels: reservoirs[0].history.map((h, i) => {
        const row: AnalyticsResponse["reservoirLevels"][number] = { date: h.date }
        for (const r of reservoirs) row[r.id] = r.history[i].levelPct
        return row
      }),
    }
  },

  jobs() {
    return demoDataset.jobs
  },

  job(id: string) {
    return demoDataset.jobs.find((j) => j.id === id) ?? null
  },

  alerts(): SystemAlert[] {
    return demoDataset.alerts.map((a) => ({ ...a, status: alertState.get(a.id) ?? a.status }))
  },

  updateAlertStatus(id: string, status: InvestigationStatus) {
    alertState.set(id, status)
    const alert = demoDataset.alerts.find((a) => a.id === id)
    const anomalyId = alert?.href?.startsWith("/anomalies/") ? alert.href.split("/").pop() : undefined
    if (anomalyId) anomalyState.set(anomalyId, status)
  },
}
