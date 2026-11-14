"use client"

import { useApiStatus } from "@/hooks/use-api"
import { ToneBadge } from "./status-badges"

export function SystemStatusBadge() {
  const status = useApiStatus()
  if (status === "demo") return <ToneBadge tone="warning">Demo mode · Backend offline</ToneBadge>
  if (status === "checking") return <ToneBadge tone="neutral">Checking backend…</ToneBadge>
  if (status === "unreachable") return <ToneBadge tone="danger" pulse>Backend unreachable</ToneBadge>
  return <ToneBadge tone="success" pulse>Backend connected</ToneBadge>
}
