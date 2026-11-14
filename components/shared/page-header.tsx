"use client"

import { Info, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { IS_DEMO_MODE } from "@/lib/config"
import { DATASET_END, DATASET_START } from "@/lib/demo/dataset"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { DemoDataBadge } from "./status-badges"

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 sm:flex">
            <Icon className="size-6" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-balance text-primary md:text-3xl">{title}</h1>
            {IS_DEMO_MODE && <DemoDataBadge />}
          </div>
          <p className="max-w-3xl text-sm text-pretty text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function DemoNotice({ className }: { className?: string }) {
  if (!IS_DEMO_MODE) return null
  return (
    <Alert className={cn("border-warning/40 bg-warning/8", className)}>
      <Info className="text-[oklch(0.55_0.14_60)]" />
      <AlertTitle>Demonstration mode: all values are DEMO DATA</AlertTitle>
      <AlertDescription>
        This is a fixed historical sample dataset ({formatDate(new Date(DATASET_START).toISOString())} to{" "}
        {formatDate(new Date(DATASET_END).toISOString())}). It is not real-time sensor data. Set{" "}
        <code className="rounded bg-muted px-1 font-mono text-xs">NEXT_PUBLIC_API_BASE_URL</code> to connect the Java / Hadoop
        MapReduce backend.
      </AlertDescription>
    </Alert>
  )
}

export function RefreshButton({ onRefresh, isRefreshing }: { onRefresh: () => void; isRefreshing?: boolean }) {
  return (
    <Button variant="outline" onClick={onRefresh} disabled={isRefreshing}>
      <RefreshCw data-icon="inline-start" className={cn(isRefreshing && "animate-spin")} />
      {isRefreshing ? "Refreshing" : "Refresh data"}
    </Button>
  )
}
