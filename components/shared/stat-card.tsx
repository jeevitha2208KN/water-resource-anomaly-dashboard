import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Tone } from "./status-badges"

const ICON_TONE: Record<Tone, string> = {
  info: "bg-info/12 text-[oklch(0.5_0.12_235)]",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-[oklch(0.55_0.14_60)]",
  orange: "bg-[oklch(0.68_0.17_45)]/12 text-[oklch(0.55_0.17_45)]",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-primary/10 text-primary",
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string
  value: string
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  tone?: Tone
}) {
  return (
    <Card className="group relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", ICON_TONE[tone])}>
            <Icon className="size-5" />
          </div>
        </div>
        <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
