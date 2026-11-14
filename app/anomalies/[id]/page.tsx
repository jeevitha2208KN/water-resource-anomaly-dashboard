import type { Metadata } from "next"
import { AnomalyDetailView } from "@/components/anomalies/anomaly-detail"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: `Anomaly ${id}` }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AnomalyDetailView id={id} />
}
