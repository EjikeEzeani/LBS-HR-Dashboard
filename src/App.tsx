"use client"

import { useState } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "./layouts/Layout"
import Overview from "./pages/Overview"
import Demographics from "./pages/Demographics"
import LearningDevelopment from "./pages/LearningDevelopment"
import SickbayReport from "./pages/SickbayReport"
import AttritionExit from "./pages/AttritionExit"
import Vacancies from "./pages/Vacancies"

export default function App() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  return (
    <Router>
      <Routes>
        <Route element={<Layout selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />}>
          <Route path="/" element={<Overview month={selectedMonth} />} />
          <Route path="/demographics" element={<Demographics month={selectedMonth} />} />
          <Route path="/learning-development" element={<LearningDevelopment month={selectedMonth} />} />
          <Route path="/sickbay" element={<SickbayReport month={selectedMonth} />} />
          <Route path="/attrition" element={<AttritionExit month={selectedMonth} />} />
          <Route path="/vacancies" element={<Vacancies month={selectedMonth} />} />
        </Route>
      </Routes>
    </Router>
  )
}
