"use client"

import { Link, useLocation } from "react-router-dom"
import {
  BarChart3,
  Users,
  BookOpen,
  Stethoscope,
  TrendingDown,
  BriefcaseIcon as BriefcaseOpen,
  Menu,
} from "lucide-react"
import { useState } from "react"

const navItems = [
  { path: "/", label: "Overview", icon: BarChart3 },
  { path: "/demographics", label: "Demographics", icon: Users },
  { path: "/learning-development", label: "Learning & Development", icon: BookOpen },
  { path: "/sickbay", label: "Sickbay Report", icon: Stethoscope },
  { path: "/attrition", label: "Attrition & Exit", icon: TrendingDown },
  { path: "/vacancies", label: "Vacancies", icon: BriefcaseOpen },
]

export default function Sidebar() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(true)

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 md:hidden bg-primary text-white p-2 rounded-lg"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static w-64 h-screen bg-sidebar border-r border-border transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">HR Dashboard</h1>
        </div>

        <nav className="p-6 space-y-2">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? "bg-primary text-white" : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
