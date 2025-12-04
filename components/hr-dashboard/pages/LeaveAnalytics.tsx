"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"
import { CalendarCheck, Clock, TriangleAlert } from "lucide-react"
import KPICard from "../KPICard"
import ChartCard from "../ChartCard"
import { getLeaveSummary } from "@/lib/hr-api"

interface LeaveAnalyticsProps {
  month: string
}

export default function LeaveAnalytics({ month }: LeaveAnalyticsProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      const summary = await getLeaveSummary(month)
      setData(summary)
      setLoading(false)
    }
    run()
  }, [month])

  if (loading) {
    return <div className="h-80 animate-pulse bg-slate-100 rounded-xl" />
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <CalendarCheck className="text-purple-600" size={28} />
        <div>
          <h1 className="text-3xl font-black">Leave Analytics</h1>
          <p className="text-slate-600 text-sm">Period {month}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Working Days Lost"
          value={data?.total_working_days_lost?.toFixed?.(1) ?? data?.total_working_days_lost ?? 0}
          icon={<Clock size={28} />}
          trendLabel="all leave types"
        />
        <KPICard
          title="Pending Approvals"
          value={data?.pending_approval_count ?? 0}
          icon={<TriangleAlert size={28} />}
          trendLabel="requests awaiting action"
          color="yellow"
        />
        <KPICard title="Trend Direction" value={data?.trend_direction ?? "flat"} icon={<CalendarCheck size={28} />} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Leave by Type">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data?.by_type ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="type" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="days" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="12-Month Trend">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data?.trend_series ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="period" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="days" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Hotspots (Top 10)">
          <div className="space-y-3">
            {(data?.hotspots ?? []).map((item: any) => (
              <div key={item.employee_number} className="flex justify-between items-center border border-slate-200 rounded-lg px-4 py-2">
                <div>
                  <p className="font-semibold">{item.employee_name}</p>
                  <p className="text-sm text-slate-500">{item.department}</p>
                </div>
                <span className="text-purple-700 font-bold">{item.days}d</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Pending by Manager">
          <div className="space-y-3">
            {(data?.pending_by_manager ?? []).map((mgr: any) => (
              <div key={mgr.manager_id} className="flex justify-between items-center border border-slate-200 rounded-lg px-4 py-2">
                <div>
                  <p className="font-semibold">{mgr.manager_name}</p>
                  <p className="text-sm text-slate-500">{mgr.manager_id}</p>
                </div>
                <span className="text-amber-600 font-bold">{mgr.pending_count} pending</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Calendar Feed (sample)">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(data?.calendar_feed ?? []).slice(0, 12).map((evt: any, idx: number) => (
            <div key={`${evt.start}-${idx}`} className="border border-slate-200 rounded-lg p-3 space-y-1">
              <p className="text-sm font-semibold">{evt.employee}</p>
              <p className="text-xs text-slate-500">
                {evt.start} → {evt.end}
              </p>
              <p className="text-xs uppercase text-purple-600 font-bold">
                {evt.type} · {evt.status}
              </p>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}

