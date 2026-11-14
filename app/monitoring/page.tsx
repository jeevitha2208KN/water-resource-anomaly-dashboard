import type { Metadata } from "next"
import { MonitoringView } from "@/components/monitoring/monitoring-view"

export const metadata: Metadata = { title: "Water Monitoring" }

export default function Page() {
  return <MonitoringView />
}
