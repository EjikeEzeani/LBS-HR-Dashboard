import { Outlet } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import TopBar from "../components/TopBar"

interface LayoutProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
}

export default function Layout({ selectedMonth, onMonthChange }: LayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
