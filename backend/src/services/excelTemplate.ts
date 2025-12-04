import ExcelJS from "exceljs"

const SHEETS: Record<string, string[]> = {
  Employees: [
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
  ],
  Departments: ["department_code", "department_name", "parent_department_code", "head_employee_number"],
  Leave: [
    "employee_number",
    "leave_type",
    "start_date (YYYY-MM-DD)",
    "end_date (YYYY-MM-DD)",
    "working_days",
    "status",
    "reason",
    "source_reference",
  ],
  "L&D": ["employee_number", "course_name", "start_date", "end_date", "status", "cost", "provider", "notes"],
  Sickbay: ["employee_number", "date (YYYY-MM-DD)", "hours_off", "reason", "approved_by_employee_number"],
  Onboarding: ["employee_number", "onboard_date", "activity", "status"],
  Exits: ["employee_number", "exit_date", "reason", "notice_period_days", "last_working_date"],
  Vacancies: ["department_code", "vacancy_id", "cadre", "status", "posted_date", "filled_date", "cost_per_hire"],
  Engagement: ["period (YYYY-MM)", "department_code", "metric_name", "metric_value"],
  StatutoryCompliance: ["item", "due_date", "status", "notes"],
  UploadMetadata: ["uploader", "upload_date (YYYY-MM-DDTHH:MM:SSZ)", "reporting_period_start", "reporting_period_end", "source_file_name"],
}

export async function generateUploadTemplate() {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "HR Analytics Backend"

  Object.entries(SHEETS).forEach(([sheetName, columns]) => {
    const sheet = workbook.addWorksheet(sheetName)
    sheet.addRow(columns)
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer
}

