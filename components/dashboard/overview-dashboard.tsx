"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AlertTriangle, ArrowRight, CheckCircle2, Droplets, Gauge, LayoutDashboard, MapPin, ShieldAlert, Waves } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, DoughnutChart, LineChart, areaGradient } from "@/components/charts/charts"
import { DemoNotice, PageHeader, RefreshButton } from "@/components/shared/page-header"
import { CardsSkeleton, ChartSkeleton, ErrorState } from "@/components/shared/query-state"
import { SimpleSelect } from "@/components/shared/simple-select"
import { StatCard } from "@/components/shared/stat-card"
import { SeverityBadge } from "@/components/shared/status-badges"
import { JobStatusPanel } from "@/components/datasets/job-status-panel"
import { refreshAll, useAnomalies, useLocations, useReadings, useReservoirs } from "@/hooks/use-api"
import { RANGE_OPTIONS, dailyAggregates, filterAnomalies, filterReadings, locationAggregates, shortName } from "@/lib/aggregate"
import { formatCompact, formatDateTime, formatNumber, formatShortDate } from "@/lib/format"
import { ANOMALY_TYPE_LABELS, CHART_COLORS } from "@/lib/labels"

function ChartCard({ title, description, children, action }: { title: string; description: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function OverviewDashboard() {
  const readingsQ = useReadings()
  const anomaliesQ = useAnomalies()
  const reservoirsQ = useReservoirs()
  const locationsQ = useLocations()
  const [range, setRange] = useState("30")
  const [location, setLocation] = useState("all")
  const [refreshing, setRefreshing] = useState(false)

  const readings = readingsQ.data
  const anomalies = anomaliesQ.data
  const reservoirs = reservoirsQ.data

  const derived = useMemo(() => {
    if (!readings || !anomalies) return null
    const r = filterReadings(readings, Number(range), location)
    const a = filterAnomalies(anomalies, readings, Number(range), location)
    return { readings: r, anomalies: a, daily: dailyAggregates(r), byLocation: locationAggregates(filterReadings(readings, Number(range), "all")) }
  }, [readings, anomalies, range, location])

  const locationOptions = useMemo(
    () => [{ value: "all", label: "All locations" }, ...(locationsQ.data ?? []).map((l) => ({ value: l.id, label: shortName(l.name) }))],
    [locationsQ.data],
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await refreshAll()
    setRefreshing(false)
  }

  const error = readingsQ.error ?? anomaliesQ.error ?? reservoirsQ.error
  const loading = !derived || !reservoirs

  const totals = derived && {
    locations: new Set(derived.readings.map((r) => r.locationId)).size,
    readings: derived.readings.length,
    normal: derived.readings.filter((r) => r.status === "normal").length,
    anomalies: derived.anomalies.length,
    leakage: derived.anomalies.filter((a) => a.type === "possible_leakage" && a.status !== "resolved").length,
    reservoirs: (reservoirs ?? []).filter((r) => r.status !== "normal" && (location === "all" || r.locationId === location)).length,
  }

  return (
    <>
      <PageHeader
        title="Overview Dashboard"
        description="City-wide view of water monitoring, MapReduce anomaly detection results and reservoir health across all demonstration zones."
        icon={LayoutDashboard}
        actions={
          <>
            <SimpleSelect value={range} onChange={setRange} options={RANGE_OPTIONS} label="Date range" />
            <SimpleSelect value={location} onChange={setLocation} options={locationOptions} label="Location" />
            <RefreshButton onRefresh={onRefresh} isRefreshing={refreshing} />
          </>
        }
      />
      <DemoNotice />

      {error ? (
        <ErrorState error={error} onRetry={onRefresh} />
      ) : loading || !totals ? (
        <>
          <CardsSkeleton />
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </>
      ) : (
        <>
          <section aria-label="Summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StatCard label="Monitoring locations" value={formatNumber(totals.locations)} hint="Reservoirs, plants, pipeline points" icon={MapPin} />
            <StatCard label="Readings processed" value={formatCompact(totals.readings)} hint={`${formatNumber(totals.readings)} records in range`} icon={Droplets} tone="info" />
            <StatCard
              label="Normal readings"
              value={formatCompact(totals.normal)}
              hint={`${((totals.normal / Math.max(1, totals.readings)) * 100).toFixed(1)}% of readings`}
              icon={CheckCircle2}
              tone="success"
            />
            <StatCard label="Anomalies detected" value={formatNumber(totals.anomalies)} hint="Flagged by MapReduce reducer" icon={ShieldAlert} tone="danger" />
            <StatCard label="Possible leakage alerts" value={formatNumber(totals.leakage)} hint="Unresolved, require investigation" icon={AlertTriangle} tone="orange" />
            <StatCard label="Reservoirs needing attention" value={formatNumber(totals.reservoirs)} hint="Outside safe operating band" icon={Waves} tone="warning" />
          </section>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              <ChartCard title="Water consumption over time" description="Estimated daily volume (kL) derived from sensor flow rates">
                <LineChart
                  label="Daily water consumption line chart"
                  height={300}
                  data={{
                    labels: derived.daily.map((d) => formatShortDate(d.date)),
                    datasets: [
                      {
                        label: "Consumption (kL)",
                        data: derived.daily.map((d) => d.consumptionKl),
                        borderColor: CHART_COLORS.blue,
                        backgroundColor: areaGradient(CHART_COLORS.blue),
                        fill: true,
                      },
                    ],
                  }}
                />
              </ChartCard>
            </div>
            <ChartCard title="Normal vs anomalous readings" description="Classification of readings in range">
              <DoughnutChart
                label="Doughnut chart of normal, warning and anomalous readings"
                height={300}
                centerValue={`${((totals.normal / Math.max(1, totals.readings)) * 100).toFixed(1)}%`}
                centerLabel="normal"
                data={{
                  labels: ["Normal", "Warning", "Anomalous"],
                  datasets: [
                    {
                      data: [
                        totals.normal,
                        derived.readings.filter((r) => r.status === "warning").length,
                        derived.readings.filter((r) => r.status === "anomaly").length,
                      ],
                      backgroundColor: [CHART_COLORS.green, "#f2c14e", CHART_COLORS.red],
                    },
                  ],
                }}
              />
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Water flow rate trend" description="Average flow rate (L/hr) and pipeline pressure (bar)">
              <LineChart
                label="Flow rate and pressure trend line chart"
                data={{
                  labels: derived.daily.map((d) => formatShortDate(d.date)),
                  datasets: [
                    { label: "Avg flow (L/hr)", data: derived.daily.map((d) => d.avgFlow), borderColor: CHART_COLORS.navy, yAxisID: "y" },
                    { label: "Avg pressure (bar)", data: derived.daily.map((d) => d.avgPressure), borderColor: CHART_COLORS.cyan, yAxisID: "y1", borderDash: [5, 4] },
                  ],
                }}
                options={{ scales: { y1: { position: "right", grid: { display: false }, border: { display: false } } } }}
              />
            </ChartCard>
            <ChartCard title="Reservoir level trend" description="Daily storage level (% of capacity)">
              <LineChart
                label="Reservoir level trend line chart"
                data={{
                  labels: (reservoirs[0]?.history ?? []).map((h) => formatShortDate(h.date)),
                  datasets: reservoirs.map((r, i) => ({
                    label: r.name.replace(" (Demo)", ""),
                    data: r.history.map((h) => h.levelPct),
                    borderColor: [CHART_COLORS.navy, CHART_COLORS.blue, CHART_COLORS.orange, CHART_COLORS.cyan][i % 4],
                  })),
                }}
                options={{ scales: { y: { min: 0, max: 100 } } }}
              />
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Location-wise water usage" description="Estimated consumption per location (kL)">
              <BarChart
                horizontal
                height={340}
                label="Horizontal bar chart of water usage per location"
                data={{
                  labels: derived.byLocation.map((l) => shortName(l.locationName)),
                  datasets: [
                    {
                      label: "Consumption (kL)",
                      data: derived.byLocation.map((l) => l.consumptionKl),
                      backgroundColor: derived.byLocation.map((l) => (l.locationId === location ? CHART_COLORS.cyan : CHART_COLORS.navy)),
                    },
                  ],
                }}
                options={{ plugins: { legend: { display: false } } }}
              />
            </ChartCard>
            <ChartCard title="Daily anomaly statistics" description="Warning and anomalous readings per day">
              <BarChart
                stacked
                height={340}
                label="Stacked bar chart of daily warnings and anomalies"
                data={{
                  labels: derived.daily.map((d) => formatShortDate(d.date)),
                  datasets: [
                    { label: "Anomalous", data: derived.daily.map((d) => d.anomaly), backgroundColor: CHART_COLORS.red },
                    { label: "Warning", data: derived.daily.map((d) => d.warning), backgroundColor: "#f2c14e" },
                  ],
                }}
              />
            </ChartCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-5">
            <Card className="min-w-0 xl:col-span-3">
              <CardHeader>
                <CardTitle>Latest flagged anomalies</CardTitle>
                <CardDescription>Possible issues that require field investigation</CardDescription>
                <CardAction>
                  <Button variant="outline" size="sm" render={<Link href="/anomalies" />} nativeButton={false}>
                    View all
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col divide-y">
                  {derived.anomalies
                    .filter((a) => a.status !== "resolved")
                    .slice(0, 6)
                    .map((a) => (
                      <li key={a.id}>
                        <Link href={`/anomalies/${a.id}`} className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                            <Gauge className="size-4" />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium">{ANOMALY_TYPE_LABELS[a.type]}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {a.id} · {shortName(a.locationName)} · {formatDateTime(a.detectedAt)}
                            </span>
                          </div>
                          <SeverityBadge severity={a.severity} />
                        </Link>
                      </li>
                    ))}
                  {derived.anomalies.filter((a) => a.status !== "resolved").length === 0 && (
                    <li className="py-6 text-center text-sm text-muted-foreground">No unresolved anomalies for this filter.</li>
                  )}
                </ul>
              </CardContent>
            </Card>
            <div className="min-w-0 xl:col-span-2">
              <JobStatusPanel compact />
            </div>
          </div>
        </>
      )}
    </>
  )
}
