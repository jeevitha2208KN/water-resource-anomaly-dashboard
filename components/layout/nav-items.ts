import {
  Activity,
  BarChart3,
  Bell,
  Database,
  LayoutDashboard,
  MapPin,
  Settings,
  ShieldAlert,
  Waves,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Overview Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Water Monitoring", href: "/monitoring", icon: Activity },
  { title: "Anomaly Detection", href: "/anomalies", icon: ShieldAlert },
  { title: "Location Monitoring", href: "/locations", icon: MapPin },
  { title: "Reservoir Management", href: "/reservoirs", icon: Waves },
  { title: "Analytics and Reports", href: "/analytics", icon: BarChart3 },
  { title: "Dataset Management", href: "/datasets", icon: Database },
  { title: "Alerts and Notifications", href: "/alerts", icon: Bell },
  { title: "Settings", href: "/settings", icon: Settings },
]

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
