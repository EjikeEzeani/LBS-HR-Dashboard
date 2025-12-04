import path from "path"
import fs from "fs"
import request from "supertest"
import ExcelJS from "exceljs"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

process.env.NODE_ENV = "test"
process.env.API_KEY = "test-key"
process.env.DATABASE_CLIENT = "sqlite3"
process.env.DATABASE_URL = "file:./data/test.db"

let app: any
let db: any

async function loadApp() {
  if (!app) {
    app = (await import("../src/app")).default
    db = (await import("../src/db")).db
    await db.migrate.latest()
  }
}

async function truncateAll() {
  const hasUploads = await db.schema.hasTable("upload_jobs")
  if (!hasUploads) {
    await db.migrate.latest()
  }
  const tables = [
    "upload_errors",
    "leave_records",
    "training_records",
    "sickbay_records",
    "onboarding_records",
    "exit_records",
    "vacancies",
    "statutory_compliance",
    "engagement_metrics",
    "cost_per_hire",
    "employees",
    "departments",
    "upload_jobs",
  ]
  for (const table of tables) {
    await db(table).del()
  }
}

const fixturesDir = path.join(process.cwd(), "tests/fixtures")
const apiKeyHeader = { "x-api-key": "test-key" }

async function uploadFixture(fileName: string) {
  const filePath = path.join(fixturesDir, fileName)
  const res = await request(app).post("/api/uploads/excel").set(apiKeyHeader).attach("file", filePath)
  expect(res.status).toBe(200)
  return res.body
}

describe("HR upload + analytics integration", () => {
  beforeAll(async () => {
    await loadApp()
  })

  beforeEach(async () => {
    await loadApp()
    await truncateAll()
  })

  afterAll(async () => {
    await truncateAll()
    await db.destroy()
  })

  it("processes September upload and exposes headcount KPI", async () => {
    const { uploadId } = await uploadFixture("HR_Report_Sept_2025.xlsx")

    const statusRes = await request(app).get(`/api/uploads/${uploadId}/status`).set(apiKeyHeader)
    expect(statusRes.status).toBe(200)
    expect(statusRes.body.status).toBe("COMPLETED")
    expect(statusRes.body.processed_rows).toBeGreaterThan(0)

    const kpiRes = await request(app).get("/api/dashboards/kpis").query({ period: "2025-09" })
    expect(kpiRes.status).toBe(200)
    expect(kpiRes.body.headcount).toBe(5)
  })

  it("computes month-over-month deltas for hires and exits", async () => {
    await uploadFixture("HR_Report_Aug_2025.xlsx")
    const augKpis = await request(app).get("/api/dashboards/kpis").query({ period: "2025-08" })
    expect(augKpis.body.new_hires).toBe(0)
    expect(augKpis.body.exits).toBe(0)

    await uploadFixture("HR_Report_Sept_2025.xlsx")
    const septKpis = await request(app).get("/api/dashboards/kpis").query({ period: "2025-09" })
    expect(septKpis.body.new_hires).toBe(1)
    expect(septKpis.body.exits).toBe(1)

    expect(septKpis.body.new_hires - augKpis.body.new_hires).toBe(1)
    expect(septKpis.body.exits - augKpis.body.exits).toBe(1)
  })

  it("rejects uploads missing required Leave sheet", async () => {
    const workbook = new ExcelJS.Workbook()
    const employeesSheet = workbook.addWorksheet("Employees")
    employeesSheet.addRow([
      "employee_number",
      "first_name",
      "last_name",
      "email",
      "department",
      "job_title",
      "grade",
      "manager_employee_number",
      "hire_date (YYYY-MM-DD)",
      "exit_date (YYYY-MM-DD or blank)",
      "status",
      "gender",
      "birthdate (YYYY-MM-DD)",
      "location",
    ])
    employeesSheet.addRow(["E999", "Test", "User", "test@corp.com", "OPS", "Tester", "G1", "", "2025-01-01", "", "ACTIVE", "Other", "1999-01-01", "Remote"])

    const departmentsSheet = workbook.addWorksheet("Departments")
    departmentsSheet.addRow(["department_code", "department_name", "parent_department_code", "head_employee_number"])
    departmentsSheet.addRow(["OPS", "Operations", "", "E999"])

    const metadataSheet = workbook.addWorksheet("UploadMetadata")
    metadataSheet.addRow(["uploader", "upload_date (YYYY-MM-DDTHH:MM:SSZ)", "reporting_period_start", "reporting_period_end", "source_file_name"])
    metadataSheet.addRow(["QA", "2025-09-01T00:00:00Z", "2025-09-01", "2025-09-30", "missing_leave.xlsx"])

    const tempPath = path.join(process.cwd(), "tests/fixtures/missing_leave.xlsx")
    await workbook.xlsx.writeFile(tempPath)

    const res = await request(app).post("/api/uploads/excel").set(apiKeyHeader).attach("file", tempPath)
    expect(res.status).toBe(400)
    expect(res.body.error).toBe("missing_sheet")
    expect(res.body.errors[0].sheet).toBe("Leave")

    fs.unlinkSync(tempPath)
  })

  it("returns structured error when leave sheet has malformed dates", async () => {
    const workbook = new ExcelJS.Workbook()
    const employeesSheet = workbook.addWorksheet("Employees")
    employeesSheet.addRow([
      "employee_number",
      "first_name",
      "last_name",
      "email",
      "department",
      "job_title",
      "grade",
      "manager_employee_number",
      "hire_date (YYYY-MM-DD)",
      "exit_date (YYYY-MM-DD or blank)",
      "status",
      "gender",
      "birthdate (YYYY-MM-DD)",
      "location",
    ])
    employeesSheet.addRow(["E111", "Bad", "Date", "bad@corp.com", "OPS", "QA", "G1", "", "2025-01-01", "", "ACTIVE", "Other", "1999-01-01", "Remote"])

    const departmentsSheet = workbook.addWorksheet("Departments")
    departmentsSheet.addRow(["department_code", "department_name", "parent_department_code", "head_employee_number"])
    departmentsSheet.addRow(["OPS", "Operations", "", "E111"])

    const leaveSheet = workbook.addWorksheet("Leave")
    leaveSheet.addRow(["employee_number", "leave_type", "start_date (YYYY-MM-DD)", "end_date (YYYY-MM-DD)", "working_days", "status", "reason", "source_reference"])
    leaveSheet.addRow(["E111", "Annual", "bad-date", "2025-09-05", 3, "APPROVED", "Test", "LV-ERR"])

    const metadataSheet = workbook.addWorksheet("UploadMetadata")
    metadataSheet.addRow(["uploader", "upload_date (YYYY-MM-DDTHH:MM:SSZ)", "reporting_period_start", "reporting_period_end", "source_file_name"])
    metadataSheet.addRow(["QA", "2025-09-01T00:00:00Z", "2025-09-01", "2025-09-30", "bad_date.xlsx"])

    const tempPath = path.join(process.cwd(), "tests/fixtures/bad_date.xlsx")
    await workbook.xlsx.writeFile(tempPath)

    const res = await request(app).post("/api/uploads/excel").set(apiKeyHeader).attach("file", tempPath)
    expect(res.status).toBe(400)
    expect(Array.isArray(res.body.errors)).toBe(true)
    expect(res.body.errors[0].sheet).toBe("Leave")

    fs.unlinkSync(tempPath)
  })

  it("provides leave analytics contract with trend direction", async () => {
    await uploadFixture("HR_Report_Aug_2025.xlsx")
    await uploadFixture("HR_Report_Sept_2025.xlsx")

    const res = await request(app).get("/api/leave/summary").query({ period: "2025-09" })
    expect(res.status).toBe(200)
    expect(res.body.trend_series).toHaveLength(12)
    expect(["increasing", "decreasing", "flat"]).toContain(res.body.trend_direction)
    expect(Array.isArray(res.body.pending)).toBe(true)
    expect(res.body.pending_by_manager).toBeDefined()
  })
})

