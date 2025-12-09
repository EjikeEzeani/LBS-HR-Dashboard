"use client"

import ExcelJS from "exceljs"
import PptxGenJS from "pptxgenjs"
import {
  getOverviewKPIs,
  getDemographicsData,
  getLearningDevelopment,
  getSickbayData,
  getAttritionData,
  getVacancies,
  getLeaveData,
} from "./hr-api"

const downloadBuffer = (buffer: ArrayBuffer, fileName: string, mime: string) => {
  const blob = new Blob([buffer], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export const exportHrReportExcel = async (month: string) => {
  const [overview, demographics, learning, sickbay, attrition, vacancies, leave] = await Promise.all([
    getOverviewKPIs(month),
    getDemographicsData(month),
    getLearningDevelopment(month),
    getSickbayData(month),
    getAttritionData(month),
    getVacancies(month),
    getLeaveData(month),
  ])

  const workbook = new ExcelJS.Workbook()
  workbook.created = new Date()

  const overviewSheet = workbook.addWorksheet("Overview")
  overviewSheet.addRow(["HR Dashboard Overview", `Month: ${month}`])
  overviewSheet.addRows([
    ["Total Staff", overview.totalStaff],
    ["Attrition Rate", `${overview.attritionRate}%`],
    ["Open Vacancies", overview.vacancies],
    ["Training Completion", `${overview.trainingSummary}%`],
    ["Sickbay Cases", overview.sickbayCases],
  ])

  const demographicsSheet = workbook.addWorksheet("Demographics")
  demographicsSheet.addRow(["Gender"]).font = { bold: true }
  demographics.gender.forEach((item: any) => demographicsSheet.addRow([item.name, item.value]))
  demographicsSheet.addRow([])
  demographicsSheet.addRow(["Contract Types"]).font = { bold: true }
  demographics.contractTypes.forEach((item: any) => demographicsSheet.addRow([item.name, item.value]))
  demographicsSheet.addRow([])
  demographicsSheet.addRow(["Cadre"]).font = { bold: true }
  demographics.cadre.forEach((item: any) => demographicsSheet.addRow([item.name, item.value]))
  demographicsSheet.addRow([])
  demographicsSheet.addRow(["Zones"]).font = { bold: true }
  demographics.zones.forEach((item: any) => demographicsSheet.addRow([item.name, item.value]))
  demographicsSheet.addRow([])
  demographicsSheet.addRow(["Religion"]).font = { bold: true }
  demographics.religion.forEach((item: any) => demographicsSheet.addRow([item.name, item.value]))

  const learningSheet = workbook.addWorksheet("Learning & Dev")
  learningSheet.addRows([
    ["Udemy Licenses - Active", learning.udemyLicenses.active],
    ["Udemy Licenses - Inactive", learning.udemyLicenses.inactive],
    ["Budget Usage", `${learning.ldBudgetUsage}%`],
    ["Training Sessions", learning.trainingSessions],
    ["Completion Rate", `${learning.completionRate}%`],
  ])
  learningSheet.addRow([])
  learningSheet.addRow(["Top Courses", "Participants"])
  learning.topCourses.forEach((item: any) => learningSheet.addRow([item.name, item.participants]))

  const leaveSheet = workbook.addWorksheet("Leave Analysis")
  leaveSheet.addRows([
    ["Total Requests", leave.totalRequests],
    ["Approved", leave.approved],
    ["Pending", leave.pending],
    ["Rejected", leave.rejected],
    ["Average Days", leave.avgDays],
  ])
  leaveSheet.addRow([])
  leaveSheet.addRow(["By Type", "Count"])
  leave.byType.forEach((item: any) => leaveSheet.addRow([item.name, item.value]))
  leaveSheet.addRow([])
  leaveSheet.addRow(["Monthly Trend", "Requests"])
  leave.monthlyTrend.forEach((item: any) => leaveSheet.addRow([item.month, item.requests]))

  const sickbaySheet = workbook.addWorksheet("Sickbay")
  sickbaySheet.addRows([
    ["Total Cases", sickbay.totalCases],
    ["Avg Duration (days)", sickbay.avgDuration],
  ])
  sickbaySheet.addRow([])
  sickbaySheet.addRow(["Cases by Type", "Count"])
  sickbay.byType.forEach((item: any) => sickbaySheet.addRow([item.name, item.value]))
  sickbaySheet.addRow([])
  sickbaySheet.addRow(["Monthly Trend", "Cases"])
  sickbay.monthlyTrend.forEach((item: any) => sickbaySheet.addRow([item.month, item.cases]))

  const attritionSheet = workbook.addWorksheet("Attrition & Exit")
  attritionSheet.addRows([
    ["Total Exits", attrition.totalExits],
    ["Average Tenure", `${attrition.avgTenure} years`],
  ])
  attritionSheet.addRow([])
  attritionSheet.addRow(["Exit Reasons", "Count"])
  attrition.exitReasons.forEach((item: any) => attritionSheet.addRow([item.name, item.value]))
  attritionSheet.addRow([])
  attritionSheet.addRow(["Attrition By Month", "Rate %"])
  attrition.attritionByMonth.forEach((item: any) => attritionSheet.addRow([item.month, item.rate]))

  const vacanciesSheet = workbook.addWorksheet("Vacancies")
  vacanciesSheet.addRow(["Total Vacancies", vacancies.totalVacancies])
  vacanciesSheet.addRow([])
  vacanciesSheet.addRow(["Openings", "Department", "Posted"])
  vacancies.openings.forEach((item: any) => vacanciesSheet.addRow([item.position, item.department, item.posted]))
  vacanciesSheet.addRow([])
  vacanciesSheet.addRow(["Applicants by Position", "Count"])
  vacancies.applicantsByPosition.forEach((item: any) => vacanciesSheet.addRow([item.position, item.applicants]))

  ;[overviewSheet, demographicsSheet, learningSheet, leaveSheet, sickbaySheet, attritionSheet, vacanciesSheet].forEach(
    (sheet) => {
      sheet.columns?.forEach((column) => {
        let maxLength = 0
        column.eachCell({ includeEmpty: true }, (cell) => {
          const value = cell.value?.toString() ?? ""
          maxLength = Math.max(maxLength, value.length + 2)
        })
        column.width = Math.min(Math.max(maxLength, 12), 40)
      })
    },
  )

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBuffer(buffer, `hr-dashboard-${month}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
}

export const exportHrReportPpt = async (month: string) => {
  const [overview, leave, attrition, sickbay, learning, vacancies] = await Promise.all([
    getOverviewKPIs(month),
    getLeaveData(month),
    getAttritionData(month),
    getSickbayData(month),
    getLearningDevelopment(month),
    getVacancies(month),
  ])

  const pptx = new PptxGenJS()
  pptx.author = "HR Dashboard"
  pptx.company = "HR Analytics"

  const title = pptx.addSlide()
  title.addText("HR Dashboard Report", { x: 1, y: 1.2, fontSize: 28, bold: true })
  title.addText(`Month: ${month}`, { x: 1, y: 2, fontSize: 18, color: "666666" })

  const kpiSlide = pptx.addSlide()
  kpiSlide.addText("Overview KPIs", { x: 0.5, y: 0.5, fontSize: 22, bold: true })
  kpiSlide.addText(
    [
      `Total Staff: ${overview.totalStaff}`,
      `Attrition Rate: ${overview.attritionRate}%`,
      `Open Vacancies: ${overview.vacancies}`,
      `Training Completion: ${overview.trainingSummary}%`,
      `Sickbay Cases: ${overview.sickbayCases}`,
    ].join("\n"),
    { x: 0.7, y: 1.1, fontSize: 16, lineSpacingMultiple: 1.2 },
  )

  const leaveSlide = pptx.addSlide()
  leaveSlide.addText("Leave Analysis", { x: 0.5, y: 0.5, fontSize: 22, bold: true })
  leaveSlide.addText(
    [
      `Total Requests: ${leave.totalRequests}`,
      `Approved: ${leave.approved}`,
      `Pending: ${leave.pending}`,
      `Rejected: ${leave.rejected}`,
      `Average Days: ${leave.avgDays}`,
    ].join("\n"),
    { x: 0.7, y: 1.1, fontSize: 16, lineSpacingMultiple: 1.2 },
  )

  const attritionSlide = pptx.addSlide()
  attritionSlide.addText("Attrition & Exit", { x: 0.5, y: 0.5, fontSize: 22, bold: true })
  attritionSlide.addText(
    [`Total Exits: ${attrition.totalExits}`, `Average Tenure: ${attrition.avgTenure} years`].join("\n"),
    { x: 0.7, y: 1.1, fontSize: 16, lineSpacingMultiple: 1.2 },
  )

  const sickbaySlide = pptx.addSlide()
  sickbaySlide.addText("Sickbay", { x: 0.5, y: 0.5, fontSize: 22, bold: true })
  sickbaySlide.addText(
    [`Total Cases: ${sickbay.totalCases}`, `Average Duration: ${sickbay.avgDuration} days`].join("\n"),
    { x: 0.7, y: 1.1, fontSize: 16, lineSpacingMultiple: 1.2 },
  )

  const learningSlide = pptx.addSlide()
  learningSlide.addText("Learning & Development", { x: 0.5, y: 0.5, fontSize: 22, bold: true })
  learningSlide.addText(
    [
      `Udemy Licenses Active: ${learning.udemyLicenses.active}`,
      `Udemy Licenses Inactive: ${learning.udemyLicenses.inactive}`,
      `Budget Usage: ${learning.ldBudgetUsage}%`,
      `Training Sessions: ${learning.trainingSessions}`,
    ].join("\n"),
    { x: 0.7, y: 1.1, fontSize: 16, lineSpacingMultiple: 1.2 },
  )

  const vacanciesSlide = pptx.addSlide()
  vacanciesSlide.addText("Vacancies", { x: 0.5, y: 0.5, fontSize: 22, bold: true })
  vacanciesSlide.addText(
    [
      `Total Vacancies: ${vacancies.totalVacancies}`,
      "Openings:",
      ...vacancies.openings.map((o: any) => `- ${o.position} (${o.department})`),
    ].join("\n"),
    { x: 0.7, y: 1.1, fontSize: 16, lineSpacingMultiple: 1.2 },
  )

  await pptx.writeFile({ fileName: `hr-dashboard-${month}.pptx` })
}


