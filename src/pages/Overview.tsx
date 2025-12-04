import { Users, TrendingUp, BriefcaseIcon as BriefcaseOpen, BookOpen, Pill } from "lucide-react"
import KPICard from "../components/KPICard"
import { useOverviewKPIs } from "../hooks/useApiData"

interface OverviewProps {
  month: string
}

export default function Overview({ month }: OverviewProps) {
  const { data, isLoading, error } = useOverviewKPIs(month)

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Key performance indicators for{" "}
          {new Date(month + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Staff"
          value={data?.totalStaff || 0}
          icon={<Users size={32} />}
          trend={2.5}
          trendLabel="vs last month"
        />
        <KPICard
          title="Attrition Rate"
          value={`${data?.attritionRate || 0}%`}
          icon={<TrendingUp size={32} />}
          trend={-1.2}
          trendLabel="improvement"
        />
        <KPICard
          title="Open Vacancies"
          value={data?.vacancies || 0}
          icon={<BriefcaseOpen size={32} />}
          subtitle="Active positions"
        />
        <KPICard
          title="Training Completion"
          value={`${data?.trainingSummary || 0}%`}
          icon={<BookOpen size={32} />}
          trend={5.8}
          trendLabel="vs target"
        />
        <KPICard
          title="Sickbay Cases"
          value={data?.sickbayCases || 0}
          icon={<Pill size={32} />}
          trend={-2.3}
          trendLabel="decrease"
        />
      </div>
    </div>
  )
}
