"use client"

import { useId } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { performanceByMonth } from "@/lib/dashboard-mock"
import { easeOut } from "@/lib/motion"

const chartConfig = {
  cotacoes: {
    label: "Cotações",
    color: "oklch(0.68 0.18 252)",
  },
  fechamentos: {
    label: "Fechamentos",
    color: "oklch(0.72 0.14 198)",
  },
} as const

export function PerformanceChart() {
  const uid = useId().replace(/:/g, "")
  const g1 = `cot-${uid}`
  const g2 = `fec-${uid}`
  const glow = `glow-${uid}`
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
      className="relative w-full"
    >
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[260px] w-full sm:h-[300px] lg:h-[340px]"
      >
        <LineChart
          data={performanceByMonth}
          margin={{ top: 36, right: 16, bottom: 12, left: 0 }}
        >
          <defs>
            <linearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-cotacoes)" stopOpacity={0.45} />
              <stop offset="85%" stopColor="var(--color-cotacoes)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-fechamentos)" stopOpacity={0.35} />
              <stop offset="85%" stopColor="var(--color-fechamentos)" stopOpacity={0} />
            </linearGradient>
            <filter id={glow} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid
            strokeDasharray="3 6"
            vertical={false}
            stroke="oklch(1 0 0 / 0.06)"
          />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={14}
            tick={{
              fill: "oklch(0.58 0.018 250)",
              fontSize: 11,
              fontWeight: 500,
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            width={44}
            tick={{
              fill: "oklch(0.58 0.018 250)",
              fontSize: 11,
              fontWeight: 500,
            }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent className="glass-panel border-white/[0.1] shadow-xl" />
            }
          />
          <Area
            type="monotone"
            dataKey="fechamentos"
            stroke="none"
            fill={`url(#${g2})`}
            fillOpacity={1}
            isAnimationActive={!reduce}
            animationDuration={1200}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="cotacoes"
            stroke="none"
            fill={`url(#${g1})`}
            fillOpacity={1}
            isAnimationActive={!reduce}
            animationDuration={1400}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="cotacoes"
            stroke="var(--color-cotacoes)"
            strokeWidth={2.5}
            dot={false}
            filter={`url(#${glow})`}
            isAnimationActive={!reduce}
            animationDuration={1500}
            activeDot={{
              r: 6,
              strokeWidth: 2,
              stroke: "oklch(0.115 0.014 268)",
              fill: "var(--color-cotacoes)",
            }}
          />
          <Line
            type="monotone"
            dataKey="fechamentos"
            stroke="var(--color-fechamentos)"
            strokeWidth={2}
            strokeDasharray="0"
            dot={false}
            isAnimationActive={!reduce}
            animationDuration={1600}
            activeDot={{
              r: 5,
              strokeWidth: 2,
              stroke: "oklch(0.115 0.014 268)",
              fill: "var(--color-fechamentos)",
            }}
          />
          <ChartLegend
            verticalAlign="top"
            align="right"
            content={
              <ChartLegendContent className="justify-end gap-4 pb-4 text-xs" />
            }
          />
        </LineChart>
      </ChartContainer>
    </motion.div>
  )
}
