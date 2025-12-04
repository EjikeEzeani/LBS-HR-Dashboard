import axios from "axios"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000"
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ""

const client = axios.create({
  baseURL: API_BASE,
  headers: API_KEY ? { "x-api-key": API_KEY } : undefined,
})

// KPI summary (overview)
export const getOverviewKPIs = async (month: string) => {
  const res = await client.get("/api/dashboards/kpis", { params: { period: month } })
  const data = res.data
  return {
    headcount: data.headcount ?? 0,
    turnoverRate: data.turnover_rate ?? 0,
    vacancies: data.vacancy_count ?? 0,
    sickbayCases: data.sick_days_total ?? 0,
    avgTimeToHire: data.avg_time_to_hire_days ?? 0,
    newHires: data.new_hires ?? 0,
    exits: data.exits ?? 0,
  }
}

// Department/demographics placeholder (still using static mock until backend endpoint available)
export const getDemographicsData = async (_month: string) => {
  return {
    gender: [
      { name: "Male", value: 0 },
      { name: "Female", value: 0 },
    ],
    contractTypes: [],
    cadre: [],
    zones: [],
    religion: [],
    generations: [],
  }
}

export const getLearningDevelopment = async (_month: string) => {
  return {
    udemyLicenses: { active: 0, inactive: 0 },
    ldBudgetUsage: 0,
    trainingSessions: 0,
    completionRate: 0,
    topCourses: [],
  }
}

export const getSickbayData = async (_month: string) => {
  return {
    totalCases: 0,
    avgDuration: 0,
    byType: [],
    monthlyTrend: [],
  }
}

export const getAttritionData = async (_month: string) => {
  return {
    totalExits: 0,
    avgTenure: 0,
    exitReasons: [],
    attritionByMonth: [],
  }
}

export const getVacancies = async (_month: string) => {
  return {
    totalVacancies: 0,
    openings: [],
    applicantsByPosition: [],
  }
}

export const getLeaveSummary = async (period: string) => {
  const res = await client.get("/api/leave/summary", { params: { period } })
  return res.data
}
