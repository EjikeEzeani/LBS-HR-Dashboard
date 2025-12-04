"use client"

import { Calendar } from "lucide-react"

interface TopBarProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
}

export default function TopBar({ selectedMonth, onMonthChange }: TopBarProps) {
  return (
    <div className="bg-card border-b border-border px-8 py-4 flex items-center justify-between sticky top-0 z-40">
      <h2 className="text-2xl font-bold text-foreground">HR Management System</h2>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg">
          <Calendar size={18} className="text-primary" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="bg-muted text-foreground text-sm font-medium focus:outline-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
