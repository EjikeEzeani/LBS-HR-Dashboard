"use client"

import { BarChart3, Users, BookOpen, Stethoscope, TrendingDown, BriefcaseIcon, Menu, Sparkles, CalendarCheck } from "lucide-react"
import { useState } from "react"

const navItems = [
  { path: "/", label: "Overview", icon: BarChart3 },
  { path: "/demographics", label: "Demographics", icon: Users },
  { path: "/learning-development", label: "Learning & Development", icon: BookOpen },
  { path: "/sickbay", label: "Sickbay Report", icon: Stethoscope },
  { path: "/leave", label: "Leave Analytics", icon: CalendarCheck },
  { path: "/attrition", label: "Attrition & Exit", icon: TrendingDown },
  { path: "/vacancies", label: "Vacancies", icon: BriefcaseIcon },
]

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 md:hidden bg-gradient-to-r from-purple-600 to-cyan-500 text-white p-2 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
      >
        <Menu size={24} />
      </button>

      <aside
        className={`fixed md:static w-64 h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 border-r border-purple-700/50 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-purple-700/50 bg-gradient-to-r from-purple-800/50 to-purple-900/50">
          <div className="flex items-center gap-2">
            <Sparkles className="text-yellow-400" size={24} />
            <h1 className="text-2xl font-black bg-gradient-to-r from-yellow-300 via-cyan-300 to-purple-300 bg-clip-text text-transparent">
              HR Dashboard
            </h1>
          </div>
        </div>

        <nav className="p-6 space-y-2">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = currentPage === path
            return (
              <button
                key={path}
                onClick={() => {
                  onPageChange(path)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left font-medium ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg scale-105"
                    : "text-purple-100 hover:bg-purple-700/50 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">{label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
