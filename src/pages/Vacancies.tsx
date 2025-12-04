import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import KPICard from "../components/KPICard"
import ChartCard from "../components/ChartCard"
import { useVacancies } from "../hooks/useApiData"
import { BriefcaseIcon as BriefcaseOpen } from "lucide-react"

interface VacanciesProps {
  month: string
}

export default function Vacancies({ month }: VacanciesProps) {
  const { data, isLoading, error } = useVacancies(month)

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-lg mb-6" />
        <div className="h-80 bg-muted rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load data. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Open Vacancies</h1>
        <p className="text-muted-foreground">Current job openings and applicant information</p>
      </div>

      <KPICard
        title="Total Open Positions"
        value={data?.totalVacancies || 0}
        icon={<BriefcaseOpen size={32} />}
        subtitle="Available opportunities"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Applicants by Position">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.applicantsByPosition} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis
                dataKey="position"
                type="category"
                width={130}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="applicants" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Open Positions">
          <div className="space-y-3">
            {data?.openings?.map((opening, idx) => (
              <div
                key={idx}
                className="p-4 bg-muted rounded-lg border border-border hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{opening.position}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{opening.department}</p>
                  </div>
                  <span className="text-xs bg-primary text-white px-2 py-1 rounded">Posted {opening.posted}</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
