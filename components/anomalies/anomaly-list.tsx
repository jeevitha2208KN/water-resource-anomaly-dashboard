"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { CheckCheck, CircleCheck, Eye, Search, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarChart, DoughnutChart } from "@/components/charts/charts"
import { DemoNotice, PageHeader, RefreshButton } from "@/components/shared/page-header"
import { EmptyState, ErrorState, TableSkeleton } from "@/components/shared/query-state"
import { SimpleSelect } from "@/components/shared/simple-select"
import { InvestigationBadge, SeverityBadge } from "@/components/shared/status-badges"
import { setAnomalyStatus, useAnomalies } from "@/hooks/use-api"
import { shortName } from "@/lib/aggregate"
import { formatDateTime, formatNumber } from "@/lib/format"
import { ANOMALY_TYPE_LABELS, CHART_COLORS, SEVERITY_COLORS, SEVERITY_ORDER } from "@/lib/labels"
import type { Anomaly, AnomalyType, InvestigationStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const TYPE_OPTIONS = [{ value: "all", label: "All anomaly types" }, ...Object.entries(ANOMALY_TYPE_LABELS).map(([value, label]) => ({ value, label }))]
const SEVERITY_OPTIONS = [{ value: "all", label: "All severities" }, ...SEVERITY_ORDER.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))]

export function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = score >= 0.85 ? "bg-destructive" : score >= 0.7 ? "bg-[oklch(0.68_0.17_45)]" : score >= 0.5 ? "bg-warning" : "bg-info"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums">{score.toFixed(2)}</span>
    </div>
  )
}

export function formatValue(a: Pick<Anomaly, "unit">, v: number) {
  return `${Math.abs(v) >= 1000 ? formatNumber(Math.round(v)) : v.toFixed(2)}${a.unit ? ` ${a.unit}` : ""}`
}

export function StatusActions({ anomaly, size = "sm" }: { anomaly: Anomaly; size?: "sm" | "default" }) {
  const [pending, setPending] = useState<InvestigationStatus | null>(null)
  const update = async (status: InvestigationStatus) => {
    setPending(status)
    try {
      await setAnomalyStatus(anomaly.id, status)
      toast.success(status === "acknowledged" ? `${anomaly.id} acknowledged` : `${anomaly.id} marked as resolved`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Status update failed")
    } finally {
      setPending(null)
    }
  }
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size={size} disabled={anomaly.status !== "open" || pending !== null} onClick={() => update("acknowledged")}>
        <CheckCheck data-icon="inline-start" />
        {pending === "acknowledged" ? "Saving" : "Acknowledge"}
      </Button>
      <Button size={size} disabled={anomaly.status === "resolved" || pending !== null} onClick={() => update("resolved")}>
        <CircleCheck data-icon="inline-start" />
        {pending === "resolved" ? "Saving" : "Resolve"}
      </Button>
    </div>
  )
}

export function AnomalyList() {
  const { data, error, isLoading, mutate, isValidating } = useAnomalies()
  const [query, setQuery] = useState("")
  const [type, setType] = useState("all")
  const [severity, setSeverity] = useState("all")
  const [status, setStatus] = useState("all")

  const rows = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return data
      .filter(
        (a) =>
          (type === "all" || a.type === type) &&
          (severity === "all" || a.severity === severity) &&
          (status === "all" || a.status === status) &&
          (!q || [a.id, a.sensorId, a.locationName, ANOMALY_TYPE_LABELS[a.type]].some((v) => v.toLowerCase().includes(q))),
      )
      .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))
  }, [data, query, type, severity, status])

  const counts = useMemo(() => {
    const all = data ?? []
    return {
      all: all.length,
      open: all.filter((a) => a.status === "open").length,
      acknowledged: all.filter((a) => a.status === "acknowledged").length,
      resolved: all.filter((a) => a.status === "resolved").length,
    }
  }, [data])

  const byType = useMemo(() => {
    const m = new Map<AnomalyType, number>()
    rows.forEach((a) => m.set(a.type, (m.get(a.type) ?? 0) + 1))
    return (Object.keys(ANOMALY_TYPE_LABELS) as AnomalyType[]).map((t) => ({ type: t, count: m.get(t) ?? 0 }))
  }, [rows])

  return (
    <>
      <PageHeader
        title="Anomaly Detection"
        description="Readings flagged by the MapReduce anomaly detection job when they deviate significantly from each sensor's statistical baseline."
        icon={ShieldAlert}
        actions={<RefreshButton onRefresh={() => mutate()} isRefreshing={isValidating} />}
      />
      <DemoNotice />
      <Alert>
        <ShieldAlert />
        <AlertTitle>Detected anomalies indicate possible issues, not confirmed faults</AlertTitle>
        <AlertDescription>
          A flagged reading means the value is statistically unusual compared with the sensor&apos;s baseline. A possible leakage flag requires field
          investigation before it can be treated as a physical leak.
        </AlertDescription>
      </Alert>

      {error ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="min-w-0 lg:col-span-3">
              <CardHeader>
                <CardTitle>Anomalies by category</CardTitle>
                <CardDescription>Count within current filters</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  horizontal
                  height={240}
                  label="Bar chart of anomaly counts by category"
                  data={{
                    labels: byType.map((t) => ANOMALY_TYPE_LABELS[t.type]),
                    datasets: [
                      {
                        label: "Anomalies",
                        data: byType.map((t) => t.count),
                        backgroundColor: [CHART_COLORS.red, CHART_COLORS.navy, CHART_COLORS.orange, CHART_COLORS.cyan, CHART_COLORS.blue, CHART_COLORS.teal],
                      },
                    ],
                  }}
                  options={{ plugins: { legend: { display: false } } }}
                />
              </CardContent>
            </Card>
            <Card className="min-w-0 lg:col-span-2">
              <CardHeader>
                <CardTitle>Severity distribution</CardTitle>
                <CardDescription>Based on normalised anomaly score</CardDescription>
              </CardHeader>
              <CardContent>
                <DoughnutChart
                  label="Doughnut chart of anomaly severity distribution"
                  height={240}
                  centerValue={formatNumber(rows.length)}
                  centerLabel="anomalies"
                  data={{
                    labels: SEVERITY_ORDER.map((s) => s[0].toUpperCase() + s.slice(1)),
                    datasets: [{ data: SEVERITY_ORDER.map((s) => rows.filter((a) => a.severity === s).length), backgroundColor: SEVERITY_ORDER.map((s) => SEVERITY_COLORS[s]) }],
                  }}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detected anomalies</CardTitle>
              <CardDescription>{formatNumber(rows.length)} matching anomalies</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Tabs value={status} onValueChange={(v) => setStatus(String(v))}>
                <TabsList>
                  <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                  <TabsTrigger value="open">Open ({counts.open})</TabsTrigger>
                  <TabsTrigger value="acknowledged">Acknowledged ({counts.acknowledged})</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved ({counts.resolved})</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search anomaly ID, sensor, location or type"
                    aria-label="Search anomalies"
                    className="h-9 bg-card pl-9"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <SimpleSelect value={type} onChange={setType} options={TYPE_OPTIONS} label="Filter by anomaly type" className="min-w-52" />
                  <SimpleSelect value={severity} onChange={setSeverity} options={SEVERITY_OPTIONS} label="Filter by severity" />
                </div>
              </div>

              {isLoading || !data ? (
                <TableSkeleton />
              ) : rows.length === 0 ? (
                <EmptyState title="No anomalies match" description="Adjust the filters or search term to see more results." />
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Anomaly ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location / Sensor</TableHead>
                        <TableHead className="text-right">Observed</TableHead>
                        <TableHead className="text-right">Baseline</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Detected</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((a) => (
                        <TableRow key={a.id} className={cn(a.status === "resolved" && "opacity-65")}>
                          <TableCell>
                            <Link href={`/anomalies/${a.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">
                              {a.id}
                            </Link>
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">{ANOMALY_TYPE_LABELS[a.type]}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="max-w-44 truncate">{shortName(a.locationName)}</span>
                              <span className="font-mono text-xs text-muted-foreground">{a.sensorId}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium whitespace-nowrap text-destructive tabular-nums">{formatValue(a, a.observedValue)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap text-muted-foreground tabular-nums">{formatValue(a, a.baselineValue)}</TableCell>
                          <TableCell>
                            <ScoreBar score={a.score} />
                          </TableCell>
                          <TableCell>
                            <SeverityBadge severity={a.severity} />
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(a.detectedAt)}</TableCell>
                          <TableCell>
                            <InvestigationBadge status={a.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1.5">
                              <Tooltip>
                                <TooltipTrigger
                                  render={<Button variant="ghost" size="icon-sm" aria-label={`View ${a.id} details`} render={<Link href={`/anomalies/${a.id}`} />} nativeButton={false} />}
                                >
                                  <Eye />
                                </TooltipTrigger>
                                <TooltipContent>View details</TooltipContent>
                              </Tooltip>
                              <StatusActions anomaly={a} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  )
}
