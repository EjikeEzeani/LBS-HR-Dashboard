import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import KPICard from "../components/KPICard"
import ChartCard from "../components/ChartCard"
import { useLearningDevelopment } from "../hooks/useApiData"
import { BookOpen, Award, TrendingUp } from "lucide-react"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b"]

interface LearningDevelopmentProps {
  month: string
}

export default function LearningDevelopment({ month }: LearningDevelopmentProps) {
  const { data, isLoading, error } = useLearningDevelopment(month)

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Learning & Development</h1>
        <p className="text-muted-foreground">Training programs and employee development metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Active Udemy Licenses"
          value={data?.udemyLicenses?.active || 0}
          icon={<BookOpen size={32} />}
          subtitle={`${data?.udemyLicenses?.inactive || 0} inactive`}
        />
        <KPICard
          title="L&D Budget Used"
          value={`${data?.ldBudgetUsage || 0}%`}
          icon={<TrendingUp size={32} />}
          trendLabel="of total budget"
        />
        <KPICard
          title="Completion Rate"
          value={`${data?.completionRate || 0}%`}
          icon={<Award size={32} />}
          trendLabel="training programs"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Training Sessions This Month">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[{ name: "Sessions", value: data?.trainingSessions || 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fill: "var(--muted-foreground)" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Courses">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.topCourses} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis
                dataKey="name"
                type="category"
                width={120}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="participants" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
