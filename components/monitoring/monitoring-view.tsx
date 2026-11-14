"use client"

import { useMemo, useState } from "react"
import { Activity, ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DemoNotice, PageHeader, RefreshButton } from "@/components/shared/page-header"
import { EmptyState, ErrorState, TableSkeleton } from "@/components/shared/query-state"
import { SimpleSelect } from "@/components/shared/simple-select"
import { ReadingStatusBadge } from "@/components/shared/status-badges"
import { useLocations, useReadings } from "@/hooks/use-api"
import { RANGE_OPTIONS, filterReadings, shortName } from "@/lib/aggregate"
import { formatDateTime, formatNumber } from "@/lib/format"
import type { SensorReading } from "@/lib/types"
import { cn } from "@/lib/utils"
import { SensorDetailSheet } from "./sensor-detail-sheet"

type SortKey = "timestamp" | "sensorId" | "flowRate" | "pressure" | "waterLevel" | "ph" | "turbidity"
const PAGE_SIZE = 15

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "normal", label: "Normal" },
  { value: "warning", label: "Warning" },
  { value: "anomaly", label: "Abnormal" },
]

function SortHeader({ label, k, sort, onSort, className }: { label: string; k: SortKey; sort: { key: SortKey; dir: "asc" | "desc" }; onSort: (k: SortKey) => void; className?: string }) {
  const active = sort.key === k
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown
  return (
    <TableHead className={className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onSort(k)} className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}>
        {label}
        <Icon className="size-3.5" />
      </button>
    </TableHead>
  )
}

export function MonitoringView() {
  const { data, error, isLoading, mutate, isValidating } = useReadings()
  const locationsQ = useLocations()
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("all")
  const [status, setStatus] = useState("all")
  const [range, setRange] = useState("7")
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "timestamp", dir: "desc" })
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<SensorReading | null>(null)

  const rows = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    const filtered = filterReadings(data, Number(range), location).filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (!q || r.sensorId.toLowerCase().includes(q) || r.locationName.toLowerCase().includes(q)),
    )
    const dir = sort.dir === "asc" ? 1 : -1
    return filtered.sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))) * dir
    })
  }, [data, query, location, status, range, sort])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const pageRows = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  const onSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }))
  const resetPage = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v)
    setPage(0)
  }

  const locationOptions = [{ value: "all", label: "All locations" }, ...(locationsQ.data ?? []).map((l) => ({ value: l.id, label: shortName(l.name) }))]
  const counts = { normal: rows.filter((r) => r.status === "normal").length, warning: rows.filter((r) => r.status === "warning").length, anomaly: rows.filter((r) => r.status === "anomaly").length }

  return (
    <>
      <PageHeader
        title="Water Monitoring"
        description="Sensor readings for flow rate, pipeline pressure, reservoir level and water quality. Select a row to inspect an individual sensor."
        icon={Activity}
        actions={<RefreshButton onRefresh={() => mutate()} isRefreshing={isValidating} />}
      />
      <DemoNotice />

      <Card>
        <CardHeader>
          <CardTitle>Sensor readings</CardTitle>
          <CardDescription>
            {formatNumber(rows.length)} readings · <span className="text-success">{formatNumber(counts.normal)} normal</span> ·{" "}
            <span className="text-[oklch(0.55_0.14_60)]">{formatNumber(counts.warning)} warning</span> ·{" "}
            <span className="text-destructive">{formatNumber(counts.anomaly)} abnormal</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => resetPage(setQuery)(e.target.value)}
                placeholder="Search by sensor ID or location"
                aria-label="Search sensors"
                className="h-9 bg-card pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <SimpleSelect value={location} onChange={resetPage(setLocation)} options={locationOptions} label="Filter by location" />
              <SimpleSelect value={status} onChange={resetPage(setStatus)} options={STATUS_OPTIONS} label="Filter by status" className="min-w-32" />
              <SimpleSelect value={range} onChange={resetPage(setRange)} options={RANGE_OPTIONS} label="Filter by date" />
            </div>
          </div>

          {error ? (
            <ErrorState error={error} onRetry={() => mutate()} />
          ) : isLoading || !data ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState title="No readings match" description="Try a different search term, location, status or date range." />
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <SortHeader label="Sensor ID" k="sensorId" sort={sort} onSort={onSort} />
                      <TableHead>Location</TableHead>
                      <SortHeader label="Timestamp" k="timestamp" sort={sort} onSort={onSort} />
                      <SortHeader label="Flow (L/hr)" k="flowRate" sort={sort} onSort={onSort} className="text-right" />
                      <SortHeader label="Pressure (bar)" k="pressure" sort={sort} onSort={onSort} className="text-right" />
                      <SortHeader label="Level (%)" k="waterLevel" sort={sort} onSort={onSort} className="text-right" />
                      <SortHeader label="pH" k="ph" sort={sort} onSort={onSort} className="text-right" />
                      <SortHeader label="Turbidity (NTU)" k="turbidity" sort={sort} onSort={onSort} className="text-right" />
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((r) => (
                      <TableRow
                        key={r.id}
                        className={cn("cursor-pointer", r.status === "anomaly" && "bg-destructive/4", r.status === "warning" && "bg-warning/5")}
                        onClick={() => setSelected(r)}
                      >
                        <TableCell className="font-mono text-xs font-medium">{r.sensorId}</TableCell>
                        <TableCell className="max-w-48 truncate">{shortName(r.locationName)}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(r.timestamp)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(r.flowRate)}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.pressure.toFixed(2)}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.waterLevel.toFixed(1)}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.ph.toFixed(2)}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.turbidity.toFixed(2)}</TableCell>
                        <TableCell>
                          <ReadingStatusBadge status={r.status} />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`View sensor ${r.sensorId} details`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelected(r)
                            }}
                          >
                            <Eye />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  Page {current + 1} of {pageCount}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
                    <ChevronLeft data-icon="inline-start" />
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}>
                    Next
                    <ChevronRight data-icon="inline-end" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <SensorDetailSheet reading={selected} readings={data ?? []} onOpenChange={(o) => !o && setSelected(null)} />
    </>
  )
}
