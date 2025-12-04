import ExcelJS from "exceljs"
import { db } from "../db"

export async function buildPeriodExport(period: string) {
  const workbook = new ExcelJS.Workbook()
  const [year, month] = period.split("-").map(Number)
  const periodStart = new Date(Date.UTC(year, (month ?? 1) - 1, 1))
  const periodEnd = new Date(Date.UTC(year, (month ?? 1), 0))

  const employees = await db("employees")
    .select("employee_number", "first_name", "last_name", "department_code", "job_title", "status")
    .orderBy("department_code")

  const leaves = await db("leave_records")
    .select("employee_number", "leave_type", "start_date", "end_date", "working_days", "status")
    .whereBetween("start_date", [periodStart.toISOString(), periodEnd.toISOString()])

  const summarySheet = workbook.addWorksheet("Summary")
  summarySheet.addRow(["Period", period])
  summarySheet.addRow(["Headcount", employees.length])
  const totalLeave = leaves.reduce((acc, row) => acc + Number(row.working_days ?? 0), 0)
  summarySheet.addRow(["Working Days Lost", totalLeave])

  const employeesSheet = workbook.addWorksheet("Employees")
  employeesSheet.addRow(["Employee #", "First Name", "Last Name", "Department", "Job Title", "Status"])
  employees.forEach((emp) => {
    employeesSheet.addRow([
      emp.employee_number,
      emp.first_name,
      emp.last_name,
      emp.department_code,
      emp.job_title,
      emp.status,
    ])
  })

  const leaveSheet = workbook.addWorksheet("Leave")
  leaveSheet.addRow(["Employee #", "Type", "Start", "End", "Working Days", "Status"])
  leaves.forEach((leave) => {
    leaveSheet.addRow([
      leave.employee_number,
      leave.leave_type,
      leave.start_date,
      leave.end_date,
      leave.working_days,
      leave.status,
    ])
  })

  return workbook.xlsx.writeBuffer()
}

