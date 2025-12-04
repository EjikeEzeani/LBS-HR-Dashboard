import fs from "fs"
import path from "path"
import ExcelJS from "exceljs"

type FixtureConfig = {
  period: string
  fileName: string
  employees: any[]
  leave: any[]
}

const departments = [
  { department_code: "OPS", department_name: "Operations", parent_department_code: "", head_employee_number: "E100" },
  { department_code: "HR", department_name: "Human Resources", parent_department_code: "", head_employee_number: "E400" },
]

const optionalSheets = ["L&D", "Sickbay", "Onboarding", "Exits", "Vacancies", "Engagement", "StatutoryCompliance"]

const fixtures: FixtureConfig[] = [
  {
    period: "2025-08",
    fileName: "HR_Report_Aug_2025.xlsx",
    employees: [
      {
        employee_number: "E100",
        first_name: "Alice",
        last_name: "Owens",
        email: "alice@corp.com",
        department: "OPS",
        job_title: "Head of Operations",
        grade: "G6",
        manager_employee_number: "",
        hire_date: "2018-04-01",
        exit_date: "",
        status: "ACTIVE",
        gender: "Female",
        birthdate: "1985-01-01",
        location: "Lagos",
      },
      {
        employee_number: "E200",
        first_name: "John",
        last_name: "Doe",
        email: "john@corp.com",
        department: "OPS",
        job_title: "Operations Analyst",
        grade: "G4",
        manager_employee_number: "E100",
        hire_date: "2022-05-10",
        exit_date: "",
        status: "ACTIVE",
        gender: "Male",
        birthdate: "1992-03-12",
        location: "Lagos",
      },
      {
        employee_number: "E300",
        first_name: "Mary",
        last_name: "Major",
        email: "mary@corp.com",
        department: "HR",
        job_title: "HR Specialist",
        grade: "G4",
        manager_employee_number: "E400",
        hire_date: "2021-07-19",
        exit_date: "",
        status: "ACTIVE",
        gender: "Female",
        birthdate: "1990-07-05",
        location: "Abuja",
      },
      {
        employee_number: "E400",
        first_name: "Zara",
        last_name: "Khan",
        email: "zara@corp.com",
        department: "HR",
        job_title: "Head of HR",
        grade: "G5",
        manager_employee_number: "",
        hire_date: "2019-09-01",
        exit_date: "",
        status: "ACTIVE",
        gender: "Female",
        birthdate: "1987-11-17",
        location: "Abuja",
      },
    ],
    leave: [
      {
        employee_number: "E200",
        leave_type: "Annual",
        start_date: "2025-08-05",
        end_date: "2025-08-07",
        working_days: 3,
        status: "APPROVED",
        reason: "Vacation",
        source_reference: "LV-801",
      },
      {
        employee_number: "E300",
        leave_type: "Sick",
        start_date: "2025-08-20",
        end_date: "2025-08-21",
        working_days: 2,
        status: "APPROVED",
        reason: "Flu",
        source_reference: "LV-802",
      },
    ],
  },
  {
    period: "2025-09",
    fileName: "HR_Report_Sept_2025.xlsx",
    employees: [
      {
        employee_number: "E100",
        first_name: "Alice",
        last_name: "Owens",
        email: "alice@corp.com",
        department: "OPS",
        job_title: "Head of Operations",
        grade: "G6",
        manager_employee_number: "",
        hire_date: "2018-04-01",
        exit_date: "",
        status: "ACTIVE",
        gender: "Female",
        birthdate: "1985-01-01",
        location: "Lagos",
      },
      {
        employee_number: "E200",
        first_name: "John",
        last_name: "Doe",
        email: "john@corp.com",
        department: "OPS",
        job_title: "Operations Analyst",
        grade: "G4",
        manager_employee_number: "E100",
        hire_date: "2022-05-10",
        exit_date: "",
        status: "ACTIVE",
        gender: "Male",
        birthdate: "1992-03-12",
        location: "Lagos",
      },
      {
        employee_number: "E300",
        first_name: "Mary",
        last_name: "Major",
        email: "mary@corp.com",
        department: "HR",
        job_title: "HR Specialist",
        grade: "G4",
        manager_employee_number: "E400",
        hire_date: "2021-07-19",
        exit_date: "2025-09-15",
        status: "TERMINATED",
        gender: "Female",
        birthdate: "1990-07-05",
        location: "Abuja",
      },
      {
        employee_number: "E400",
        first_name: "Zara",
        last_name: "Khan",
        email: "zara@corp.com",
        department: "HR",
        job_title: "Head of HR",
        grade: "G5",
        manager_employee_number: "",
        hire_date: "2019-09-01",
        exit_date: "",
        status: "ACTIVE",
        gender: "Female",
        birthdate: "1987-11-17",
        location: "Abuja",
      },
      {
        employee_number: "E500",
        first_name: "Liam",
        last_name: "Stone",
        email: "liam@corp.com",
        department: "OPS",
        job_title: "Operations Associate",
        grade: "G3",
        manager_employee_number: "E100",
        hire_date: "2025-09-05",
        exit_date: "",
        status: "ACTIVE",
        gender: "Male",
        birthdate: "1995-02-08",
        location: "Lagos",
      },
    ],
    leave: [
      {
        employee_number: "E200",
        leave_type: "Annual",
        start_date: "2025-09-10",
        end_date: "2025-09-13",
        working_days: 4,
        status: "APPROVED",
        reason: "Vacation",
        source_reference: "LV-901",
      },
      {
        employee_number: "E500",
        leave_type: "Sick",
        start_date: "2025-09-25",
        end_date: "2025-09-26",
        working_days: 2,
        status: "PENDING",
        reason: "Medical",
        source_reference: "LV-902",
      },
    ],
  },
]

async function writeRow(sheet: ExcelJS.Worksheet, data: any[]) {
  sheet.addRow(data)
}

async function buildFixture(fixture: FixtureConfig, outputDir: string) {
  const workbook = new ExcelJS.Workbook()

  const employeesSheet = workbook.addWorksheet("Employees")
  await writeRow(employeesSheet, [
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
  fixture.employees.forEach((emp) => {
    employeesSheet.addRow([
      emp.employee_number,
      emp.first_name,
      emp.last_name,
      emp.email,
      emp.department,
      emp.job_title,
      emp.grade,
      emp.manager_employee_number,
      emp.hire_date,
      emp.exit_date,
      emp.status,
      emp.gender,
      emp.birthdate,
      emp.location,
    ])
  })

  const departmentsSheet = workbook.addWorksheet("Departments")
  await writeRow(departmentsSheet, ["department_code", "department_name", "parent_department_code", "head_employee_number"])
  departments.forEach((dept) => {
    departmentsSheet.addRow([dept.department_code, dept.department_name, dept.parent_department_code, dept.head_employee_number])
  })

  const leaveSheet = workbook.addWorksheet("Leave")
  await writeRow(leaveSheet, ["employee_number", "leave_type", "start_date (YYYY-MM-DD)", "end_date (YYYY-MM-DD)", "working_days", "status", "reason", "source_reference"])
  fixture.leave.forEach((leave) => {
    leaveSheet.addRow([
      leave.employee_number,
      leave.leave_type,
      leave.start_date,
      leave.end_date,
      leave.working_days,
      leave.status,
      leave.reason,
      leave.source_reference,
    ])
  })

  optionalSheets.forEach((name) => {
    const sheet = workbook.addWorksheet(name)
    switch (name) {
      case "L&D":
        sheet.addRow(["employee_number", "course_name", "start_date", "end_date", "status", "cost", "provider", "notes"])
        break
      case "Sickbay":
        sheet.addRow(["employee_number", "date (YYYY-MM-DD)", "hours_off", "reason", "approved_by_employee_number"])
        break
      case "Onboarding":
        sheet.addRow(["employee_number", "onboard_date", "activity", "status"])
        break
      case "Exits":
        sheet.addRow(["employee_number", "exit_date", "reason", "notice_period_days", "last_working_date"])
        break
      case "Vacancies":
        sheet.addRow(["department_code", "vacancy_id", "cadre", "status", "posted_date", "filled_date", "cost_per_hire"])
        break
      case "Engagement":
        sheet.addRow(["period (YYYY-MM)", "department_code", "metric_name", "metric_value"])
        sheet.addRow([fixture.period, "OPS", "engagement_score", 78])
        sheet.addRow([fixture.period, "HR", "engagement_score", 81])
        break
      case "StatutoryCompliance":
        sheet.addRow(["item", "due_date", "status", "notes"])
        break
      default:
        break
    }
  })

  const metadataSheet = workbook.addWorksheet("UploadMetadata")
  await writeRow(metadataSheet, ["uploader", "upload_date (YYYY-MM-DDTHH:MM:SSZ)", "reporting_period_start", "reporting_period_end", "source_file_name"])
  metadataSheet.addRow([
    "Fixture Loader",
    `${fixture.period}-01T08:00:00Z`,
    `${fixture.period}-01`,
    `${fixture.period}-30`,
    fixture.fileName,
  ])

  await workbook.xlsx.writeFile(path.join(outputDir, fixture.fileName))
}

async function main() {
  const fixturesDir = path.join(process.cwd(), "tests/fixtures")
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true })
  }
  for (const fixture of fixtures) {
    await buildFixture(fixture, fixturesDir)
  }
  console.log("Fixtures generated in tests/fixtures")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

