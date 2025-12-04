import type { ReactNode } from "react"

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: number
  trendLabel?: string
}

export default function KPICard({ title, value, subtitle, icon, trend, trendLabel }: KPICardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        {icon && <div className="text-primary opacity-80">{icon}</div>}
      </div>

      {trend !== undefined && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${trend >= 0 ? "text-success" : "text-destructive"}`}>
              {trend >= 0 ? "+" : ""}
              {trend}%
            </span>
            {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
