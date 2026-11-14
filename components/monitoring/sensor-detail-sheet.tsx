"use client"

import { useMemo } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { LineChart } from "@/components/charts/charts"
import { DemoDataBadge, ReadingStatusBadge } from "@/components/shared/status-badges"
import { shortName } from "@/lib/aggregate"
import { IS_DEMO_MODE } from "@/lib/config"
import { formatDateTime, formatNumber, formatShortDate } from "@/lib/format"
import { CHART_COLORS } from "@/lib/labels"
import type { SensorReading } from "@/lib/types"

export function SensorDetailSheet({
  reading,
  readings,
  onOpenChange,
}: {
  reading: SensorReading | null
  readings: SensorReading[]
  onOpenChange: (open: boolean) => void
}) {
  const history = useMemo(() => {
    if (!reading) return []
    const all = readings.filter((r) => r.sensorId === reading.sensorId).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    const idx = all.findIndex((r) => r.id === reading.id)
    return all.slice(Math.max(0, idx - 40), idx + 1)
  }, [reading, readings])

  const sensorAll = reading ? readings.filter((r) => r.sensorId === reading.sensorId) : []
  const abnormal = sensorAll.filter((r) => r.status !== "normal").length

  return (
    <Sheet open={reading !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {reading && (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="font-mono">{reading.sensorId}</SheetTitle>
                <ReadingStatusBadge status={reading.status} />
                {IS_DEMO_MODE && <DemoDataBadge />}
              </div>
              <SheetDescription>
                {shortName(reading.locationName)} · reading at {formatDateTime(reading.timestamp)}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-6 px-4 pb-6">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ["Flow rate", `${formatNumber(reading.flowRate)} L/hr`],
                  ["Pressure", `${reading.pressure.toFixed(2)} bar`],
                  ["Water level", `${reading.waterLevel.toFixed(1)} %`],
                  ["pH", reading.ph.toFixed(2)],
                  ["Turbidity", `${reading.turbidity.toFixed(2)} NTU`],
                  ["Abnormal readings", `${abnormal} of ${sensorAll.length}`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border bg-muted/40 p-3">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="mt-1 font-semibold tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              <Separator />
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">Flow rate leading up to this reading</h3>
                <LineChart
                  label={`Flow rate history for sensor ${reading.sensorId}`}
                  height={200}
                  data={{
                    labels: history.map((h) => formatShortDate(h.timestamp)),
                    datasets: [
                      {
                        label: "Flow (L/hr)",
                        data: history.map((h) => h.flowRate),
                        borderColor: CHART_COLORS.blue,
                        pointRadius: history.map((h) => (h.status === "normal" ? 0 : 4)),
                        pointBackgroundColor: history.map((h) => (h.status === "anomaly" ? CHART_COLORS.red : CHART_COLORS.orange)),
                      },
                    ],
                  }}
                  options={{ plugins: { legend: { display: false } } }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">Pipeline pressure</h3>
                <LineChart
                  label={`Pressure history for sensor ${reading.sensorId}`}
                  height={180}
                  data={{
                    labels: history.map((h) => formatShortDate(h.timestamp)),
                    datasets: [{ label: "Pressure (bar)", data: history.map((h) => h.pressure), borderColor: CHART_COLORS.navy }],
                  }}
                  options={{ plugins: { legend: { display: false } } }}
                />
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
