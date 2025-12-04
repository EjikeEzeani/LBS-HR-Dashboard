"use client"

import type { ReactNode } from "react"

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: number
  trendLabel?: string
  color?: "purple" | "cyan" | "yellow" | "pink" | "green"
}

export default function KPICard({ title, value, subtitle, icon, trend, trendLabel, color = "purple" }: KPICardProps) {
  /* Enhanced color system with premium gradients and glassmorphism */
  const colorClasses = {
    purple: "from-purple-500/15 via-purple-400/5 to-transparent",
    cyan: "from-cyan-500/15 via-cyan-400/5 to-transparent",
    yellow: "from-yellow-500/15 via-yellow-400/5 to-transparent",
    pink: "from-pink-500/15 via-pink-400/5 to-transparent",
    green: "from-green-500/15 via-green-400/5 to-transparent",
  }

  const borderClasses = {
    purple: "border-purple-300/50 hover:border-purple-400/80 dark:border-purple-500/30 dark:hover:border-purple-400/60",
    cyan: "border-cyan-300/50 hover:border-cyan-400/80 dark:border-cyan-500/30 dark:hover:border-cyan-400/60",
    yellow: "border-yellow-300/50 hover:border-yellow-400/80 dark:border-yellow-500/30 dark:hover:border-yellow-400/60",
    pink: "border-pink-300/50 hover:border-pink-400/80 dark:border-pink-500/30 dark:hover:border-pink-400/60",
    green: "border-green-300/50 hover:border-green-400/80 dark:border-green-500/30 dark:hover:border-green-400/60",
  }

  const iconClasses = {
    purple: "text-purple-600 dark:text-purple-400",
    cyan: "text-cyan-600 dark:text-cyan-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    pink: "text-pink-600 dark:text-pink-400",
    green: "text-green-600 dark:text-green-400",
  }

  const accentClasses = {
    purple: "from-purple-600 to-purple-700",
    cyan: "from-cyan-600 to-cyan-700",
    yellow: "from-yellow-600 to-yellow-700",
    pink: "from-pink-600 to-pink-700",
    green: "from-green-600 to-green-700",
  }

  return (
    <div
      className={`glass group relative overflow-hidden bg-gradient-to-br ${colorClasses[color]} border-2 ${borderClasses[color]} rounded-2xl p-6 hover-lift slide-up`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${accentClasses[color]} opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity duration-300`}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
            <p className="text-4xl font-black gradient-text from-slate-900 to-slate-700 dark:from-white dark:to-slate-200">
              {value}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground mt-3 font-medium">{subtitle}</p>}
          </div>
          {icon && <div className={`text-3xl ${iconClasses[color]} opacity-80 icon-glow group`}>{icon}</div>}
        </div>

        {trend !== undefined && (
          <div className="mt-6 pt-4 border-t border-white/20 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-bold text-lg ${trend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
              </span>
              {trendLabel && <span className="text-xs text-muted-foreground font-semibold">{trendLabel}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
