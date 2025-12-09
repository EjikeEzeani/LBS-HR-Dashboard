"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts"
import KPICard from "../KPICard"
import ChartCard from "../ChartCard"
import { getLeaveData } from "@/lib/hr-api"
import { CalendarClock, Clock3, CheckCircle2, Hourglass, XCircle } from "lucide-react"

const COLORS = ["#6366f1", "#22c55e", "#f97316", "#06b6d4"]

interface LeaveAnalysisProps {
  month: string
}

export default function LeaveAnalysis({ month }: LeaveAnalysisProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const result = await getLeaveData(month)
      setData(result)
      setLoading(false)
    }
    fetchData()
  }, [month])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl shadow-lg">
          <CalendarClock className="text-white" size={22} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Leave Analysis</h1>
          <p className="text-slate-600">Usage patterns and approval insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Requests"
          value={data?.totalRequests || 0}
          icon={<CalendarClock size={28} />}
          color="purple"
        />
        <KPICard title="Approved" value={data?.approved || 0} icon={<CheckCircle2 size={28} />} color="green" />
        <KPICard title="Pending" value={data?.pending || 0} icon={<Hourglass size={28} />} color="yellow" />
        <KPICard title="Rejected" value={data?.rejected || 0} icon={<XCircle size={28} />} color="pink" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Leave by Type" accentColor="cyan">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data?.byType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {data?.byType?.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Leave Requests" accentColor="purple">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data?.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="requests" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl border border-indigo-100 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <Clock3 className="text-indigo-500" size={20} />
            <h3 className="text-lg font-semibold text-slate-900">Average Leave Duration</h3>
          </div>
          <p className="text-4xl font-black text-indigo-600">{data?.avgDays || 0} days</p>
          <p className="text-sm text-slate-500 mt-2">Across all approved requests</p>
        </div>
      </div>
    </div>
  )
}


