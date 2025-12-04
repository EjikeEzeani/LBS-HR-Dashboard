"use client"

import { Calendar, Zap, Settings } from "lucide-react"

interface TopBarProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
}

export default function TopBar({ selectedMonth, onMonthChange }: TopBarProps) {
  return (
    /* Premium glassmorphic top bar with enhanced gradient and shadow */
    <div className="glass sticky top-0 z-40 px-8 py-5 flex items-center justify-between border-b border-white/20 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-purple-600 via-pink-500 to-cyan-500 rounded-xl shadow-lg">
          <Zap className="text-white drop-shadow-lg" size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-black gradient-text from-purple-900 via-pink-700 to-cyan-700 dark:from-purple-300 dark:via-pink-300 dark:to-cyan-300">
            HR Management System
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Analytics & Insights</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="glass-dark px-6 py-3 rounded-xl border border-white/10 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-cyan-600 dark:text-cyan-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white text-sm font-bold focus:outline-none cursor-pointer w-32"
            />
          </div>
        </div>

        <button className="p-2.5 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors">
          <Settings size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
      </div>
    </div>
  )
}
