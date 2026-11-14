import { API_ENDPOINTS } from "../config"
import { demoApi } from "../demo/demo-api"
import type {
  AnalyticsResponse,
  Anomaly,
  AnomalyDetail,
  DashboardSummary,
  DatasetUploadResponse,
  InvestigationStatus,
  MapReduceJob,
  MonitoringLocation,
  Reservoir,
  SensorReading,
  SystemAlert,
} from "../types"
import { ApiError, apiRequest } from "./client"

export const api = {
  getDashboardSummary: () =>
    apiRequest<DashboardSummary>(API_ENDPOINTS.dashboardSummary, { demo: demoApi.summary }),

  getReadings: () => apiRequest<SensorReading[]>(API_ENDPOINTS.readings, { demo: demoApi.readings }),

  getAnomalies: () => apiRequest<Anomaly[]>(API_ENDPOINTS.anomalies, { demo: demoApi.anomalies }),

  getAnomaly: (id: string) =>
    apiRequest<AnomalyDetail>(API_ENDPOINTS.anomaly(id), { demo: () => demoApi.anomaly(id) }),

  /** Proposed endpoint: PATCH /api/anomalies/{id} with { status }. */
  updateAnomalyStatus: (id: string, status: InvestigationStatus) =>
    apiRequest<void>(API_ENDPOINTS.anomaly(id), {
      method: "PATCH",
      body: { status },
      demo: () => demoApi.updateAnomalyStatus(id, status),
    }),

  getLocations: () => apiRequest<MonitoringLocation[]>(API_ENDPOINTS.locations, { demo: demoApi.locations }),

  getReservoirs: () => apiRequest<Reservoir[]>(API_ENDPOINTS.reservoirs, { demo: demoApi.reservoirs }),

  getAnalytics: () => apiRequest<AnalyticsResponse>(API_ENDPOINTS.analytics, { demo: demoApi.analytics }),

  getJobs: () => apiRequest<MapReduceJob[]>(API_ENDPOINTS.jobs, { demo: demoApi.jobs }),

  getJob: (id: string) => apiRequest<MapReduceJob>(API_ENDPOINTS.job(id), { demo: () => demoApi.job(id) }),

  /** Proposed endpoint: GET /api/alerts. */
  getAlerts: () => apiRequest<SystemAlert[]>(API_ENDPOINTS.alerts, { demo: demoApi.alerts }),

  /** Proposed endpoint: PATCH /api/alerts/{id} with { status }. */
  updateAlertStatus: (id: string, status: InvestigationStatus) =>
    apiRequest<void>(`${API_ENDPOINTS.alerts}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { status },
      demo: () => demoApi.updateAlertStatus(id, status),
    }),

  /**
   * POST /api/datasets/upload (multipart/form-data, field "file").
   * In demo mode there is no backend, so the upload is rejected rather than pretending
   * it reached HDFS or triggered a MapReduce job.
   */
  uploadDataset: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return apiRequest<DatasetUploadResponse>(API_ENDPOINTS.datasetUpload, {
      method: "POST",
      body: form,
      demo: () => {
        throw new ApiError(
          "Demo mode: no Java backend is configured, so the file was validated in the browser only and was not submitted to Hadoop.",
          null,
        )
      },
    })
  },
}
