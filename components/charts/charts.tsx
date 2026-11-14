"use client"

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js"
import { Bar, Doughnut, Line } from "react-chartjs-2"
import { CHART_COLORS } from "@/lib/labels"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend)
ChartJS.defaults.font.family = "var(--font-geist-sans), system-ui, sans-serif"
ChartJS.defaults.color = "#64748b"

const tooltip = {
  backgroundColor: "#13254a",
  padding: 10,
  cornerRadius: 8,
  titleFont: { weight: 600 as const },
  boxPadding: 4,
}

function axisOptions(stacked = false) {
  return {
    x: { stacked, grid: { display: false }, border: { display: false }, ticks: { maxRotation: 0, autoSkipPadding: 16 } },
    y: { stacked, grid: { color: CHART_COLORS.grid }, border: { display: false }, beginAtZero: false },
  }
}

const legend = { position: "bottom" as const, labels: { usePointStyle: true, pointStyle: "circle", boxWidth: 6, boxHeight: 6, padding: 16 } }

export function LineChart({
  data,
  height = 280,
  options,
  label,
}: {
  data: ChartData<"line">
  height?: number
  options?: ChartOptions<"line">
  label: string
}) {
  const base: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    animation: { duration: 700 },
    elements: { line: { tension: 0.35, borderWidth: 2 }, point: { radius: 0, hoverRadius: 4 } },
    plugins: { legend, tooltip },
    scales: axisOptions(),
  }
  return (
    <div style={{ height }} role="img" aria-label={label}>
      <Line data={data} options={{ ...base, ...options, plugins: { ...base.plugins, ...options?.plugins }, scales: { ...base.scales, ...options?.scales } }} />
    </div>
  )
}

export function BarChart({
  data,
  height = 280,
  options,
  stacked = false,
  horizontal = false,
  label,
}: {
  data: ChartData<"bar">
  height?: number
  options?: ChartOptions<"bar">
  stacked?: boolean
  horizontal?: boolean
  label: string
}) {
  const scales = axisOptions(stacked)
  const base: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? "y" : "x",
    animation: { duration: 700 },
    plugins: { legend, tooltip },
    scales: horizontal
      ? { x: { ...scales.y, beginAtZero: true }, y: { ...scales.x, grid: { display: false } } }
      : { ...scales, y: { ...scales.y, beginAtZero: true } },
    datasets: { bar: { borderRadius: 6, borderSkipped: false, maxBarThickness: 28 } },
  }
  return (
    <div style={{ height }} role="img" aria-label={label}>
      <Bar data={data} options={{ ...base, ...options, plugins: { ...base.plugins, ...options?.plugins } }} />
    </div>
  )
}

export function DoughnutChart({
  data,
  height = 260,
  label,
  centerLabel,
  centerValue,
}: {
  data: ChartData<"doughnut">
  height?: number
  label: string
  centerLabel?: string
  centerValue?: string
}) {
  return (
    <div className="relative" style={{ height }} role="img" aria-label={label}>
      <Doughnut
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "72%",
          animation: { duration: 800 },
          plugins: { legend, tooltip },
          elements: { arc: { borderWidth: 3, borderColor: "#ffffff", borderRadius: 4 } },
        }}
      />
      {centerValue && (
        <div className="pointer-events-none absolute inset-x-0 top-[38%] flex -translate-y-1/2 flex-col items-center">
          <span className="text-2xl font-semibold text-foreground tabular-nums">{centerValue}</span>
          {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}

export const areaGradient = (color: string) => (ctx: { chart: ChartJS }) => {
  const { ctx: c, chartArea } = ctx.chart
  if (!chartArea) return `${color}33`
  const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
  g.addColorStop(0, `${color}55`)
  g.addColorStop(1, `${color}00`)
  return g
}
