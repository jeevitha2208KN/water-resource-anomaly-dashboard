"use client"

import useSWR, { mutate } from "swr"
import { API_ENDPOINTS, IS_DEMO_MODE } from "@/lib/config"
import { api } from "@/lib/api/services"
import type { InvestigationStatus } from "@/lib/types"

const options = { revalidateOnFocus: false, shouldRetryOnError: false }

export const useDashboardSummary = () => useSWR(API_ENDPOINTS.dashboardSummary, api.getDashboardSummary, options)
export const useReadings = () => useSWR(API_ENDPOINTS.readings, api.getReadings, options)
export const useAnomalies = () => useSWR(API_ENDPOINTS.anomalies, api.getAnomalies, options)
export const useAnomaly = (id: string) => useSWR(API_ENDPOINTS.anomaly(id), () => api.getAnomaly(id), options)
export const useLocations = () => useSWR(API_ENDPOINTS.locations, api.getLocations, options)
export const useReservoirs = () => useSWR(API_ENDPOINTS.reservoirs, api.getReservoirs, options)
export const useAnalytics = () => useSWR(API_ENDPOINTS.analytics, api.getAnalytics, options)
export const useJobs = () => useSWR(API_ENDPOINTS.jobs, api.getJobs, options)
export const useAlerts = () => useSWR(API_ENDPOINTS.alerts, api.getAlerts, options)

/** Reflects whether the configured backend answers. Demo mode never pings anything. */
export function useApiStatus() {
  const { data, error, isLoading } = useSWR(
    IS_DEMO_MODE ? null : "api-health",
    api.getDashboardSummary,
    { ...options, refreshInterval: 60_000 },
  )
  if (IS_DEMO_MODE) return "demo" as const
  if (isLoading) return "checking" as const
  if (error) return "unreachable" as const
  return data ? ("connected" as const) : ("checking" as const)
}

const refreshInvestigationData = () =>
  mutate(
    (key) =>
      typeof key === "string" &&
      (key.startsWith("/api/anomalies") || key.startsWith("/api/alerts") || key.startsWith("/api/dashboard") || key === API_ENDPOINTS.locations),
  )

export async function setAnomalyStatus(id: string, status: InvestigationStatus) {
  await api.updateAnomalyStatus(id, status)
  await refreshInvestigationData()
}

export async function setAlertStatus(id: string, status: InvestigationStatus) {
  await api.updateAlertStatus(id, status)
  await refreshInvestigationData()
}

export const refreshAll = () => mutate((key) => typeof key === "string" && key.startsWith("/api/"))
