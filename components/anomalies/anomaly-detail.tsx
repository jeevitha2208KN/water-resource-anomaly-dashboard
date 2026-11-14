"use client"

import Link from "next/link"
import { ArrowLeft, Cpu, MapPin, Radio, ShieldAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LineChart } from "@/components/charts/charts"
import { DemoNotice } from "@/components/shared/page-header"
import { ChartSkeleton, EmptyState, ErrorState } from "@/components/shared/query-state"
import { DemoDataBadge, InvestigationBadge, SeverityBadge } from "@/components/shared/status-badges"
import { useAnomaly } from "@/hooks/use-api"
import { shortName } from "@/lib/aggregate"
import { IS_DEMO_MODE } from "@/lib/config"
import { formatDateTime } from "@/lib/format"
import { ANOMALY_TYPE_LABELS, CHART_COLORS, METRIC_LABELS } from "@/lib/labels"
import { ScoreBar, StatusActions, formatValue } from "./anomaly-list"

const RECOMMENDATIONS: Record<string, string> = {
  possible_leakage: "Dispatch a field team to inspect the pipeline segment, compare with downstream meters and verify valve positions before confirming a leak.",
  abnormal_flow: "Cross-check with neighbouring sensors and pump schedules to rule out planned operations or meter faults.",
  pressure_drop: "Inspect for pump trips, valve changes or bursts in the pressure zone. Verify sensor calibration.",
  unusual_reservoir_level: "Compare inflow and outflow records, verify level gauge readings and check release schedules.",
  abnormal_consumption: "Review demand pattern for the zone and check for unmetered usage or billing-meter anomalies.",
  quality_variation: "Collect a manual sample for laboratory analysis and check upstream treatment process logs.",
}

export function AnomalyDetailView({ id }: { id: string }) {
  const { data: a, error, isLoading, mutate } = useAnomaly(id)

  const back = (
    <Button variant="ghost" size="sm" className="w-fit" render={<Link href="/anomalies" />} nativeButton={false}>
      <ArrowLeft data-icon="inline-start" />
      Back to anomalies
    </Button>
  )

  if (error) return <>{back}<ErrorState error={error} onRetry={() => mutate()} /></>
  if (isLoading) return <>{back}<ChartSkeleton className="h-24" /><ChartSkeleton className="h-96" /></>
  if (!a) return <>{back}<EmptyState title="Anomaly not found" description={`No anomaly with ID ${id} exists in the current dataset.`} /></>

  const metric = METRIC_LABELS[a.metric]
  const deviation = a.baselineValue !== 0 ? ((a.observedValue - a.baselineValue) / a.baselineValue) * 100 : 0
  const zScore = a.baselineStdDev > 0 ? (a.observedValue - a.baselineMean) / a.baselineStdDev : 0
  const upper = a.baselineMean + 3 * a.baselineStdDev
  const lower = a.baselineMean - 3 * a.baselineStdDev

  return (
    <>
      {back}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          <div className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive text-white shadow-md shadow-destructive/25 sm:flex">
            <ShieldAlert className="size-6" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-primary md:text-3xl">{ANOMALY_TYPE_LABELS[a.type]}</h1>
              <SeverityBadge severity={a.severity} />
              <InvestigationBadge status={a.status} />
              {IS_DEMO_MODE && <DemoDataBadge />}
            </div>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="font-mono font-medium text-foreground">{a.id}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {shortName(a.locationName)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Radio className="size-3.5" />
                {a.sensorId}
              </span>
              <span>Detected {formatDateTime(a.detectedAt)}</span>
            </p>
          </div>
        </div>
        <StatusActions anomaly={a} size="default" />
      </div>
      <DemoNotice />

      <Alert className="border-warning/40 bg-warning/8">
        <ShieldAlert className="text-[oklch(0.55_0.14_60)]" />
        <AlertTitle>Possible issue requiring investigation</AlertTitle>
        <AlertDescription>
          {a.description} This statistical flag does not by itself prove a physical fault. {RECOMMENDATIONS[a.type]}
        </AlertDescription>
      </Alert>

      <section aria-label="Anomaly metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { k: "Observed value", v: formatValue(a, a.observedValue), cls: "text-destructive" },
          { k: "Expected baseline", v: formatValue(a, a.baselineValue), cls: "" },
          { k: "Deviation from baseline", v: `${deviation > 0 ? "+" : ""}${deviation.toFixed(1)}%`, cls: "text-[oklch(0.55_0.17_45)]" },
          { k: "Z-score (σ)", v: zScore.toFixed(2), cls: "" },
        ].map((m) => (
          <Card key={m.k} size="sm">
            <CardContent className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{m.k}</span>
              <span className={`text-2xl font-semibold tabular-nums ${m.cls}`}>{m.v}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader>
            <CardTitle>
              {metric.label} history for {a.sensorId}
            </CardTitle>
            <CardDescription>Readings around the detection, with baseline mean and ±3σ band. The flagged reading is highlighted in red.</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              label={`${metric.label} history with anomalous reading highlighted`}
              height={340}
              data={{
                labels: a.history.map((h) => formatDateTime(h.timestamp).replace(" UTC", "")),
                datasets: [
                  {
                    label: `${metric.label}${metric.unit ? ` (${metric.unit})` : ""}`,
                    data: a.history.map((h) => h.value),
                    borderColor: CHART_COLORS.blue,
                    pointRadius: a.history.map((h) => (h.timestamp === a.detectedAt ? 7 : 2)),
                    pointBackgroundColor: a.history.map((h) => (h.timestamp === a.detectedAt ? CHART_COLORS.red : CHART_COLORS.blue)),
                    pointBorderColor: a.history.map((h) => (h.timestamp === a.detectedAt ? "#fff" : CHART_COLORS.blue)),
                    pointBorderWidth: a.history.map((h) => (h.timestamp === a.detectedAt ? 2 : 0)),
                  },
                  { label: "Baseline mean", data: a.history.map(() => a.baselineMean), borderColor: CHART_COLORS.green, borderDash: [6, 4], borderWidth: 1.5 },
                  { label: "+3σ", data: a.history.map(() => upper), borderColor: CHART_COLORS.slate, borderDash: [2, 3], borderWidth: 1 },
                  { label: "−3σ", data: a.history.map(() => lower), borderColor: CHART_COLORS.slate, borderDash: [2, 3], borderWidth: 1 },
                ],
              }}
              options={{ scales: { x: { ticks: { maxTicksLimit: 6 } } } }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="size-4 text-accent" />
              Detection details
            </CardTitle>
            <CardDescription>Output of the MapReduce reducer</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <dl className="flex flex-col gap-3">
              {[
                ["Metric", `${metric.label}${metric.unit ? ` (${metric.unit})` : ""}`],
                ["Baseline mean", a.baselineMean.toString()],
                ["Baseline std. dev.", a.baselineStdDev.toString()],
                ["Producing job", a.jobId],
                ["Location ID", a.locationId],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="truncate font-mono text-xs font-medium">{v}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Anomaly score</dt>
                <dd>
                  <ScoreBar score={a.score} />
                </dd>
              </div>
            </dl>
            <Separator />
            <div className="flex flex-col gap-3">
              <h3 className="font-medium">Investigation log</h3>
              <ol className="flex flex-col gap-3 border-l pl-4">
                {a.notes.map((n, i) => (
                  <li key={i} className="relative">
                    <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-card bg-accent" aria-hidden="true" />
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(n.at)} · {n.author}
                    </p>
                    <p className="text-sm">{n.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
