"use client"

import { useEffect, useState } from "react"
import { Users, TrendingUp, BriefcaseIcon, BookOpen, Pill, Sparkles } from "lucide-react"
import KPICard from "../KPICard"
import { getOverviewKPIs } from "@/lib/hr-api"

interface OverviewProps {
  month: string
}

export default function Overview({ month }: OverviewProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const result = await getOverviewKPIs(month)
      setData(result)
      setLoading(false)
    }
    fetchData()
  }, [month])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-40 glass rounded-2xl border border-white/20" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 fade-in">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
            <Sparkles className="text-white" size={20} />
          </div>
          <h1 className="text-4xl font-black gradient-text from-purple-900 via-pink-700 to-cyan-700 dark:from-purple-300 dark:via-pink-300 dark:to-cyan-300">
            Dashboard Overview
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium ml-11">
          Key performance indicators for{" "}
          <span className="font-bold gradient-text from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400">
            {new Date(month + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          title="Total Staff"
          value={data?.totalStaff || 0}
          icon={<Users size={32} />}
          trend={2.5}
          trendLabel="vs last month"
          color="purple"
        />
        <KPICard
          title="Attrition Rate"
          value={`${data?.attritionRate || 0}%`}
          icon={<TrendingUp size={32} />}
          trend={-1.2}
          trendLabel="improvement"
          color="cyan"
        />
        <KPICard
          title="Open Vacancies"
          value={data?.vacancies || 0}
          icon={<BriefcaseIcon size={32} />}
          subtitle="Active positions"
          color="yellow"
        />
        <KPICard
          title="Training Completion"
          value={`${data?.trainingSummary || 0}%`}
          icon={<BookOpen size={32} />}
          trend={5.8}
          trendLabel="vs target"
          color="pink"
        />
        <KPICard
          title="Sickbay Cases"
          value={data?.sickbayCases || 0}
          icon={<Pill size={32} />}
          trend={-2.3}
          trendLabel="decrease"
          color="green"
        />
      </div>
    </div>
  )
}
