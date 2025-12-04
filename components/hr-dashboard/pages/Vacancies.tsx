"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import KPICard from "../KPICard"
import ChartCard from "../ChartCard"
import { getVacancies } from "@/lib/hr-api"
import { BriefcaseIcon } from "lucide-react"

interface VacanciesProps {
  month: string
}

export default function Vacancies({ month }: VacanciesProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const result = await getVacancies(month)
      setData(result)
      setLoading(false)
    }
    fetchData()
  }, [month])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-lg mb-6" />
        <div className="h-80 bg-slate-200 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Open Vacancies</h1>
        <p className="text-slate-600">Current job openings and applicant information</p>
      </div>

      <KPICard
        title="Total Open Positions"
        value={data?.totalVacancies || 0}
        icon={<BriefcaseIcon size={32} />}
        subtitle="Available opportunities"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Applicants by Position">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.applicantsByPosition} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis dataKey="position" type="category" width={130} tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="applicants" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Open Positions">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {data?.openings?.map((opening: any, idx: number) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-400 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">{opening.position}</h4>
                    <p className="text-sm text-slate-500 mt-1">{opening.department}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded whitespace-nowrap">
                    Posted {opening.posted}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
