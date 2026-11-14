"use client"

import Link from "next/link"
import { ArrowRight, Cpu, FolderInput, FolderOutput } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ErrorState, TableSkeleton } from "@/components/shared/query-state"
import { JobStatusBadge } from "@/components/shared/status-badges"
import { useJobs } from "@/hooks/use-api"
import { formatDateTime, formatNumber } from "@/lib/format"
import type { MapReduceJob } from "@/lib/types"

function duration(job: MapReduceJob) {
  if (!job.startedAt || !job.finishedAt) return "—"
  const s = Math.round((Date.parse(job.finishedAt) - Date.parse(job.startedAt)) / 1000)
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function PhaseProgress({ label, value, tasks }: { label: string; value: number; tasks: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">
          {label} <span className="text-muted-foreground">({tasks} tasks)</span>
        </span>
        <span className="tabular-nums text-muted-foreground">{value}%</span>
      </div>
      <Progress value={value} aria-label={`${label} progress`} />
    </div>
  )
}

export function JobSummary({ job }: { job: MapReduceJob }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="font-mono text-xs text-muted-foreground">{job.id}</span>
          <span className="truncate font-medium">{job.name}</span>
        </div>
        <JobStatusBadge status={job.status} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <PhaseProgress label="Map phase" value={job.mapProgress} tasks={job.mapTasks} />
        <PhaseProgress label="Reduce phase" value={job.reduceProgress} tasks={job.reduceTasks} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Records in</dt>
          <dd className="font-medium tabular-nums">{formatNumber(job.recordsIn)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Records out</dt>
          <dd className="font-medium tabular-nums">{formatNumber(job.recordsOut)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Anomalies</dt>
          <dd className="font-medium tabular-nums">{formatNumber(job.anomaliesFound)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Duration</dt>
          <dd className="font-medium tabular-nums">{duration(job)}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-1.5 rounded-lg bg-muted/60 p-3 font-mono text-xs">
        <span className="flex items-center gap-2 truncate">
          <FolderInput className="size-3.5 shrink-0 text-muted-foreground" />
          {job.inputPath}
        </span>
        <span className="flex items-center gap-2 truncate">
          <FolderOutput className="size-3.5 shrink-0 text-muted-foreground" />
          {job.outputPath}
        </span>
      </div>
      {job.errorMessage && <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{job.errorMessage}</p>}
      <p className="text-xs text-muted-foreground">Submitted {formatDateTime(job.submittedAt)}</p>
    </div>
  )
}

export function JobStatusPanel({ compact = false }: { compact?: boolean }) {
  const { data, error, isLoading, mutate } = useJobs()
  const latest = data?.[0]

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="size-4 text-accent" />
          Latest MapReduce job
        </CardTitle>
        <CardDescription>Status reported by GET /api/mapreduce/jobs</CardDescription>
        {compact && (
          <CardAction>
            <Button variant="outline" size="sm" render={<Link href="/datasets" />} nativeButton={false}>
              All jobs
              <ArrowRight data-icon="inline-end" />
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState error={error} onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          <TableSkeleton rows={3} />
        ) : !latest ? (
          <p className="text-sm text-muted-foreground">No MapReduce jobs have been reported by the backend yet.</p>
        ) : (
          <>
            <JobSummary job={latest} />
            {!compact && data.length > 1 && <Separator className="my-4" />}
          </>
        )}
      </CardContent>
    </Card>
  )
}
