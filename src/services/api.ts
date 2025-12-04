import axios from "axios"

// Mock API base URL - in production this would be your actual API
const API_BASE_URL = "https://api.example.com"

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Mock data generators
const generateMockData = (seed: number) => {
  const random = Math.sin(seed) * 10000
  return Math.abs(random - Math.floor(random))
}

// API endpoints (mock implementations)
export const api = {
  getOverviewKPIs: async (month: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      totalStaff: 245,
      attritionRate: 8.5,
      vacancies: 12,
      trainingSummary: 87,
      sickbayCases: 23,
    }
  },

  getDemographicsData: async (month: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      gender: [
        { name: "Male", value: 152 },
        { name: "Female", value: 93 },
      ],
      contractTypes: [
        { name: "Permanent", value: 180 },
        { name: "Contract", value: 45 },
        { name: "Casual", value: 20 },
      ],
      cadre: [
        { name: "Management", value: 35 },
        { name: "Professional", value: 85 },
        { name: "Technical", value: 75 },
        { name: "Support", value: 50 },
      ],
      zones: [
        { name: "Zone A", value: 65 },
        { name: "Zone B", value: 85 },
        { name: "Zone C", value: 55 },
        { name: "Zone D", value: 40 },
      ],
      religion: [
        { name: "Christianity", value: 140 },
        { name: "Islam", value: 60 },
        { name: "Others", value: 45 },
      ],
      generations: [
        { name: "Gen Z", value: 30 },
        { name: "Millennials", value: 95 },
        { name: "Gen X", value: 80 },
        { name: "Boomers", value: 40 },
      ],
    }
  },

  getLearningDevelopment: async (month: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      udemyLicenses: {
        active: 156,
        inactive: 89,
      },
      ldBudgetUsage: 67.5,
      trainingSessions: 24,
      completionRate: 82,
      topCourses: [
        { name: "Leadership Skills", participants: 45 },
        { name: "Data Analytics", participants: 38 },
        { name: "Project Management", participants: 32 },
      ],
    }
  },

  getSickbayData: async (month: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      totalCases: 23,
      avgDuration: 3.2,
      byType: [
        { name: "Common Cold", value: 8 },
        { name: "Headache", value: 5 },
        { name: "Back Pain", value: 4 },
        { name: "Other", value: 6 },
      ],
      monthlyTrend: [
        { month: "Jan", cases: 18 },
        { month: "Feb", cases: 21 },
        { month: "Mar", cases: 23 },
        { month: "Apr", cases: 19 },
        { month: "May", cases: 25 },
        { month: "Jun", cases: 22 },
      ],
    }
  },

  getAttritionData: async (month: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      totalExits: 21,
      avgTenure: 4.5,
      exitReasons: [
        { name: "Better Opportunity", value: 8 },
        { name: "Relocation", value: 5 },
        { name: "Further Education", value: 4 },
        { name: "Personal Reasons", value: 4 },
      ],
      attritionByMonth: [
        { month: "Jan", rate: 5.2 },
        { month: "Feb", rate: 6.1 },
        { month: "Mar", rate: 5.8 },
        { month: "Apr", rate: 7.2 },
        { month: "May", rate: 8.5 },
      ],
    }
  },

  getVacancies: async (month: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      totalVacancies: 12,
      openings: [
        { position: "Senior Developer", department: "IT", posted: "2024-01-15" },
        { position: "HR Manager", department: "HR", posted: "2024-01-20" },
        { position: "Sales Executive", department: "Sales", posted: "2024-02-01" },
        { position: "Data Analyst", department: "Analytics", posted: "2024-02-05" },
      ],
      applicantsByPosition: [
        { position: "Senior Developer", applicants: 34 },
        { position: "HR Manager", applicants: 18 },
        { position: "Sales Executive", applicants: 42 },
        { position: "Data Analyst", applicants: 25 },
      ],
    }
  },
}
