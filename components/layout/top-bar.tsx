"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, useSyncExternalStore } from "react"
import { Bell, CalendarClock, LogOut, Menu, Search, Settings, UserRound } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SystemStatusBadge } from "@/components/shared/system-status-badge"
import { SeverityBadge } from "@/components/shared/status-badges"
import { useAlerts, useAnomalies, useLocations } from "@/hooks/use-api"
import { LOCATION_SEEDS } from "@/lib/demo/dataset"
import { cn } from "@/lib/utils"
import { Logo } from "./logo"
import { NAV_ITEMS } from "./nav-items"
import { SidebarNav } from "./app-sidebar"

function subscribeClock(cb: () => void) {
  const t = setInterval(cb, 1000)
  return () => clearInterval(t)
}
const getMinute = () => Math.floor(Date.now() / 60_000)

function Clock() {
  const minute = useSyncExternalStore(subscribeClock, getMinute, () => null)
  if (minute === null) return <span className="text-sm text-muted-foreground">--</span>
  const now = new Date(minute * 60_000)
  return (
    <time dateTime={now.toISOString()} className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
      {now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
      {" · "}
      {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
    </time>
  )
}

interface SearchResult {
  label: string
  hint: string
  href: string
}

function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const { data: anomalies } = useAnomalies()
  const { data: locations } = useLocations()

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const pages = NAV_ITEMS.filter((n) => n.title.toLowerCase().includes(q)).map((n) => ({
      label: n.title,
      hint: "Page",
      href: n.href,
    }))
    const sensors = LOCATION_SEEDS.flatMap((l) => l.sensors.map((s) => ({ sensor: s.id, loc: l.name })))
      .filter((s) => s.sensor.toLowerCase().includes(q))
      .map((s) => ({ label: s.sensor, hint: s.loc, href: `/monitoring?sensor=${s.sensor}` }))
    const locs = (locations ?? [])
      .filter((l) => l.name.toLowerCase().includes(q) || l.zone.toLowerCase().includes(q))
      .map((l) => ({ label: l.name, hint: "Location", href: `/locations?focus=${l.id}` }))
    const anoms = (anomalies ?? [])
      .filter((a) => a.id.toLowerCase().includes(q))
      .map((a) => ({ label: a.id, hint: a.locationName, href: `/anomalies/${a.id}` }))
    return [...pages, ...sensors, ...locs, ...anoms].slice(0, 8)
  }, [query, anomalies, locations])

  const go = (href: string) => {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing || e.keyCode === 229) return
          if (e.key === "Enter" && results[0]) go(results[0].href)
          if (e.key === "Escape") setOpen(false)
        }}
        placeholder="Search sensors, locations, anomalies..."
        aria-label="Global search"
        className="h-10 bg-muted/60 pl-9"
      />
      {open && query.trim() && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border bg-popover shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No matches for &ldquo;{query}&rdquo;</p>
          ) : (
            <ul className="py-1">
              {results.map((r) => (
                <li key={r.href + r.label}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(r.href)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  >
                    <span className="truncate font-medium">{r.label}</span>
                    <span className="truncate text-xs text-muted-foreground">{r.hint}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function NotificationsMenu() {
  const router = useRouter()
  const { data } = useAlerts()
  const open = (data ?? []).filter((a) => a.status === "open")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${open.length} open`}>
            <Bell />
            {open.length > 0 && (
              <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
                {open.length > 9 ? "9+" : open.length}
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            Open alerts
            <Badge variant="secondary">DEMO DATA</Badge>
          </DropdownMenuLabel>
          {open.slice(0, 5).map((a) => (
            <DropdownMenuItem key={a.id} onClick={() => router.push(a.href ?? "/alerts")} className="flex flex-col items-start gap-1 py-2">
              <div className="flex w-full items-center gap-2">
                <SeverityBadge severity={a.severity} />
                <span className="truncate text-xs text-muted-foreground">{a.source}</span>
              </div>
              <span className="line-clamp-2 text-sm">{a.title}</span>
            </DropdownMenuItem>
          ))}
          {open.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">No open alerts.</p>}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/alerts")}>View all notifications</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenu() {
  const router = useRouter()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label="User menu"
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">WO</AvatarFallback>
            </Avatar>
            <span className="hidden flex-col text-left leading-tight xl:flex">
              <span className="text-sm font-medium">Water Operator</span>
              <span className="text-[11px] text-muted-foreground">Control room · Demo</span>
            </span>
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Signed in as demo operator</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <UserRound />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <LogOut />
          Sign out (no auth in demo)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TopBar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/85 px-4 backdrop-blur-md md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
        <Menu />
      </Button>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
          <SheetHeader className="border-b border-sidebar-border">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">Main application navigation</SheetDescription>
            <Logo />
          </SheetHeader>
          <div className="px-3 py-2">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/" className="hidden min-w-0 flex-col leading-tight md:flex xl:mr-4">
        <span className="truncate text-sm font-semibold text-primary">Water Resource Anomaly Detection</span>
        <span className="truncate text-[11px] text-muted-foreground">MapReduce-based monitoring platform</span>
      </Link>

      <div className="flex flex-1 justify-center">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        <div className={cn("hidden items-center gap-2 2xl:flex")}>
          <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
          <Clock />
        </div>
        <div className="hidden md:block">
          <SystemStatusBadge />
        </div>
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  )
}
