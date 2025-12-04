"use client"

import type { ReactNode } from "react"

interface ChartCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  accentColor?: "purple" | "cyan" | "yellow" | "pink" | "green"
}

export default function ChartCard({ title, subtitle, children, accentColor = "cyan" }: ChartCardProps) {
  /* Enhanced chart card with premium glassmorphism and gradient accents */
  const accentClasses = {
    purple:
      "border-purple-300/50 hover:border-purple-400/80 dark:border-purple-500/30 from-purple-600/20 to-purple-400/5",
    cyan: "border-cyan-300/50 hover:border-cyan-400/80 dark:border-cyan-500/30 from-cyan-600/20 to-cyan-400/5",
    yellow:
      "border-yellow-300/50 hover:border-yellow-400/80 dark:border-yellow-500/30 from-yellow-600/20 to-yellow-400/5",
    pink: "border-pink-300/50 hover:border-pink-400/80 dark:border-pink-500/30 from-pink-600/20 to-pink-400/5",
    green: "border-green-300/50 hover:border-green-400/80 dark:border-green-500/30 from-green-600/20 to-green-400/5",
  }

  const accentParts = accentClasses[accentColor].split(" ")
  const borderClasses = accentParts.slice(0, 3).join(" ")
  const bgClasses = accentParts.slice(3).join(" ")

  return (
    <div
      className={`glass group relative overflow-hidden bg-gradient-to-br ${bgClasses} border-2 ${borderClasses} rounded-2xl p-7 hover-lift transition-all duration-300 shadow-md hover:shadow-xl`}
    >
      <div
        className={`absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br ${accentColor === "purple" ? "from-purple-600" : accentColor === "cyan" ? "from-cyan-600" : accentColor === "yellow" ? "from-yellow-600" : accentColor === "pink" ? "from-pink-600" : "from-green-600"} opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity duration-300`}
      />

      <div className="relative z-10 mb-6">
        <h3 className="text-xl font-bold gradient-text from-slate-900 to-slate-700 dark:from-white dark:to-slate-200">
          {title}
        </h3>
        {subtitle && <p className="text-sm text-muted-foreground mt-2 font-medium">{subtitle}</p>}
      </div>
      <div className="relative z-10 overflow-x-auto">{children}</div>
    </div>
  )
}
