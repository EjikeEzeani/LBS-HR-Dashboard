"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import KPICard from "../KPICard"
import ChartCard from "../ChartCard"
import { getLearningDevelopment } from "@/lib/hr-api"
import { BookOpen, Award, TrendingUp } from "lucide-react"

interface LearningDevelopmentProps {
  month: string
}

export default function LearningDevelopment({ month }: LearningDevelopmentProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const result = await getLearningDevelopment(month)
      setData(result)
      setLoading(false)
    }
    fetchData()
  }, [month])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gradient-to-br from-slate-200 to-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-purple-900 via-pink-700 to-cyan-700 bg-clip-text text-transparent mb-3">
          Learning & Development
        </h1>
        <p className="text-slate-600 text-lg font-medium">Training programs and employee development metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Active Udemy Licenses"
          value={data?.udemyLicenses?.active || 0}
          icon={<BookOpen size={32} />}
          subtitle={`${data?.udemyLicenses?.inactive || 0} inactive`}
          color="purple"
        />
        <KPICard
          title="L&D Budget Used"
          value={`${data?.ldBudgetUsage || 0}%`}
          icon={<TrendingUp size={32} />}
          trendLabel="of total budget"
          color="cyan"
        />
        <KPICard
          title="Completion Rate"
          value={`${data?.completionRate || 0}%`}
          icon={<Award size={32} />}
          trendLabel="training programs"
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Top Courses" accentColor="pink">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.topCourses} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={150} tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "2px solid #ec4899",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="participants" fill="#ec4899" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Training Sessions & Budget" accentColor="green">
          <div className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl border-2 border-purple-300 hover:shadow-lg transition-shadow">
              <p className="text-sm text-slate-600 mb-2 font-bold uppercase">Training Sessions</p>
              <p className="text-4xl font-black text-purple-600">{data?.trainingSessions || 0}</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-100 to-green-50 rounded-xl border-2 border-green-300 hover:shadow-lg transition-shadow">
              <p className="text-sm text-slate-600 mb-2 font-bold uppercase">Budget Used</p>
              <p className="text-4xl font-black text-green-600">{data?.ldBudgetUsage || 0}%</p>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
