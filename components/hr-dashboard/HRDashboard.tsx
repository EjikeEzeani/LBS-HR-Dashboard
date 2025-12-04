"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import TopBar from "./TopBar"
import Overview from "@/components/hr-dashboard/pages/Overview"
import Demographics from "@/components/hr-dashboard/pages/Demographics"
import LearningDevelopment from "@/components/hr-dashboard/pages/LearningDevelopment"
import SickbayReport from "@/components/hr-dashboard/pages/SickbayReport"
import AttritionExit from "@/components/hr-dashboard/pages/AttritionExit"
import Vacancies from "@/components/hr-dashboard/pages/Vacancies"
import LeaveAnalytics from "@/components/hr-dashboard/pages/LeaveAnalytics"

interface HRDashboardProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
}

const pages = {
  "/": Overview,
  "/demographics": Demographics,
  "/learning-development": LearningDevelopment,
  "/sickbay": SickbayReport,
  "/attrition": AttritionExit,
  "/vacancies": Vacancies,
  "/leave": LeaveAnalytics,
}

export default function HRDashboard({ selectedMonth, onMonthChange }: HRDashboardProps) {
  const [currentPage, setCurrentPage] = useState<keyof typeof pages>("/")

  const CurrentPage = pages[currentPage]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-8">
            <CurrentPage month={selectedMonth} />
          </div>
        </main>
      </div>
    </div>
  )
}
