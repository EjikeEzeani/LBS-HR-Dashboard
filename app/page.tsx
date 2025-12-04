"use client"

import { useState } from "react"
import HRDashboard from "@/components/hr-dashboard/HRDashboard"

export default function Home() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  return (
    <main className="w-full h-screen">
      <HRDashboard selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
    </main>
  )
}
