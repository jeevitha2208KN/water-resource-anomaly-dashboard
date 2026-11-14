import type { Metadata } from "next"
import { AnomalyList } from "@/components/anomalies/anomaly-list"

export const metadata: Metadata = { title: "Anomaly Detection" }

export default function Page() {
  return <AnomalyList />
}
