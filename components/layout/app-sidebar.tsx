"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronsLeft, ChevronsRight, Cpu } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { IS_DEMO_MODE } from "@/lib/config"
import { cn } from "@/lib/utils"
import { Logo } from "./logo"
import { NAV_ITEMS, isActive } from "./nav-items"

export function SidebarNav({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href)
        const link = (
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
              active && "bg-sidebar-accent text-sidebar-accent-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <item.icon
              className={cn("size-[18px] shrink-0", active ? "text-sidebar-primary" : "text-sidebar-foreground/70")}
              aria-hidden="true"
            />
            {collapsed ? <span className="sr-only">{item.title}</span> : <span className="truncate">{item.title}</span>}
            {active && !collapsed && <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" aria-hidden="true" />}
          </Link>
        )
        if (!collapsed) return <div key={item.href}>{link}</div>
        return (
          <Tooltip key={item.href}>
            <TooltipTrigger render={link} />
            <TooltipContent side="right">{item.title}</TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}

export function AppSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out lg:flex",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
        <Logo collapsed={collapsed} />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50 uppercase">Control centre</p>
        )}
        <SidebarNav collapsed={collapsed} />
      </div>
      <div className="flex flex-col gap-3 border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="rounded-lg bg-sidebar-accent/60 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-sidebar-accent-foreground">
              <Cpu className="size-3.5 text-sidebar-primary" aria-hidden="true" />
              Hadoop MapReduce backend
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground/70">
              {IS_DEMO_MODE ? "Not connected. Showing DEMO DATA." : "Connected via configured API base URL."}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  )
}
