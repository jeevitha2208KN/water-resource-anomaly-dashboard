import { Badge } from "@/components/ui/badge"
import type { HealthStatus, InvestigationStatus, JobStatus, ReadingStatus, Reservoir, Severity } from "@/lib/types"
import { cn } from "@/lib/utils"

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "orange"

const TONE_CLASSES: Record<Tone, string> = {
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/12 text-[oklch(0.55_0.14_60)]",
  orange: "border-[oklch(0.68_0.17_45)]/30 bg-[oklch(0.68_0.17_45)]/10 text-[oklch(0.55_0.17_45)]",
  danger: "border-destructive/25 bg-destructive/10 text-destructive",
  info: "border-info/30 bg-info/10 text-[oklch(0.5_0.12_235)]",
  neutral: "border-border bg-muted text-muted-foreground",
}

const DOT_CLASSES: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  orange: "bg-[oklch(0.68_0.17_45)]",
  danger: "bg-destructive",
  info: "bg-info",
  neutral: "bg-muted-foreground",
}

export function ToneBadge({
  tone,
  children,
  dot = true,
  pulse = false,
  className,
}: {
  tone: Tone
  children: React.ReactNode
  dot?: boolean
  pulse?: boolean
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium capitalize", TONE_CLASSES[tone], className)}>
      {dot && (
        <span className="relative flex size-1.5" aria-hidden="true">
          {pulse && <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-75", DOT_CLASSES[tone])} />}
          <span className={cn("relative inline-flex size-1.5 rounded-full", DOT_CLASSES[tone])} />
        </span>
      )}
      {children}
    </Badge>
  )
}

const SEVERITY_TONE: Record<Severity, Tone> = { critical: "danger", high: "orange", medium: "warning", low: "info" }
export const SeverityBadge = ({ severity }: { severity: Severity }) => (
  <ToneBadge tone={SEVERITY_TONE[severity]} pulse={severity === "critical"}>
    {severity}
  </ToneBadge>
)

const READING_TONE: Record<ReadingStatus, Tone> = { normal: "success", warning: "warning", anomaly: "danger" }
export const ReadingStatusBadge = ({ status }: { status: ReadingStatus }) => (
  <ToneBadge tone={READING_TONE[status]}>{status === "anomaly" ? "Abnormal" : status}</ToneBadge>
)

const HEALTH_TONE: Record<HealthStatus, Tone> = { normal: "success", warning: "warning", critical: "danger" }
export const HealthBadge = ({ status }: { status: HealthStatus }) => (
  <ToneBadge tone={HEALTH_TONE[status]} pulse={status === "critical"}>
    {status}
  </ToneBadge>
)

const INVESTIGATION_TONE: Record<InvestigationStatus, Tone> = { open: "danger", acknowledged: "info", resolved: "success" }
export const InvestigationBadge = ({ status }: { status: InvestigationStatus }) => (
  <ToneBadge tone={INVESTIGATION_TONE[status]}>{status}</ToneBadge>
)

const JOB_TONE: Record<JobStatus, Tone> = { PREP: "neutral", RUNNING: "info", SUCCEEDED: "success", FAILED: "danger", KILLED: "warning" }
export const JobStatusBadge = ({ status }: { status: JobStatus }) => (
  <ToneBadge tone={JOB_TONE[status]} pulse={status === "RUNNING"} className="uppercase">
    {status}
  </ToneBadge>
)

const RESERVOIR_TONE: Record<Reservoir["status"], Tone> = { normal: "success", low: "orange", high: "warning", critical: "danger" }
export const ReservoirStatusBadge = ({ status }: { status: Reservoir["status"] }) => (
  <ToneBadge tone={RESERVOIR_TONE[status]} pulse={status === "critical"}>
    {status === "normal" ? "Within safe band" : status === "high" ? "Unusually high" : status === "low" ? "Unusually low" : "Critically low"}
  </ToneBadge>
)

export const DemoDataBadge = ({ className }: { className?: string }) => (
  <Badge variant="outline" className={cn("border-warning/40 bg-warning/15 font-semibold tracking-wide text-[oklch(0.5_0.13_60)]", className)}>
    DEMO DATA
  </Badge>
)
