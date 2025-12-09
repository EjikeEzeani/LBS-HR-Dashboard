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
import LeaveAnalysis from "@/components/hr-dashboard/pages/LeaveAnalysis"
import DataUploads from "@/components/hr-dashboard/pages/DataUploads"
import { exportHrReportExcel, exportHrReportPpt } from "@/lib/report-export"

interface HRDashboardProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
}

const pages = {
  "/": Overview,
  "/demographics": Demographics,
  "/learning-development": LearningDevelopment,
  "/leave-analysis": LeaveAnalysis,
  "/sickbay": SickbayReport,
  "/attrition": AttritionExit,
  "/vacancies": Vacancies,
  "/uploads": DataUploads,
}

export default function HRDashboard({ selectedMonth, onMonthChange }: HRDashboardProps) {
  const [currentPage, setCurrentPage] = useState<keyof typeof pages>("/")
  const [exporting, setExporting] = useState<"excel" | "ppt" | null>(null)

  const CurrentPage = pages[currentPage]

  const handleExportExcel = async () => {
    setExporting("excel")
    try {
      await exportHrReportExcel(selectedMonth)
    } finally {
      setExporting(null)
    }
  }

  const handleExportPpt = async () => {
    setExporting("ppt")
    try {
      await exportHrReportPpt(selectedMonth)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          selectedMonth={selectedMonth}
          onMonthChange={onMonthChange}
          onExportExcel={handleExportExcel}
          onExportPpt={handleExportPpt}
          exportingLabel={exporting === "excel" ? "Exporting..." : undefined}
        />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-8">
            <CurrentPage month={selectedMonth} />
          </div>
        </main>
      </div>
    </div>
  )
}
