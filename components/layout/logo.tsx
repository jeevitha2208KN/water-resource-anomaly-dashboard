import { Droplets } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
        <Droplets className="size-5" aria-hidden="true" />
      </div>
      {!collapsed && (
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold text-sidebar-accent-foreground">AquaGuard</span>
          <span className="truncate text-[11px] text-sidebar-foreground/70">Water Anomaly Control Centre</span>
        </div>
      )}
    </div>
  )
}
