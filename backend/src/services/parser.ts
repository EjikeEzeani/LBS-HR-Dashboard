import ExcelJS from "exceljs"
import { v4 as uuid } from "uuid"
import { db } from "../db"

type SheetSummary = {
  sheet: string
  processed_rows: number
  failed_rows: number
  errors?: Array<{ row: number; column: string; message: string }>
}

const readWorksheetRows = (worksheet: ExcelJS.Worksheet) => {
  const headerRow = worksheet.getRow(1)
  const headers = (headerRow.values as any[]).slice(1).map((cell) => (cell ?? "").toString().trim())
  const rows: Record<string, any>[] = []
  if (!headers.length) return rows

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const record: Record<string, any> = {}
    headers.forEach((header, idx) => {
      record[header] = row.getCell(idx + 1).value ?? ""
    })
    rows.push(record)
  })
  return rows
}

export async function parseExcelUpload(filepath: string, originalName: string) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filepath)

  const summary: SheetSummary[] = []

  const employeesSheet = workbook.getWorksheet("Employees")
  if (employeesSheet) {
    const rows = readWorksheetRows(employeesSheet)
    const errors: SheetSummary["errors"] = []
    let processed = 0

    for (const [index, row] of rows.entries()) {
      if (!row["employee_number"]) {
        errors.push({ row: index + 2, column: "employee_number", message: "missing employee_number" })
        continue
      }

      await db("employees")
        .insert({
          id: uuid(),
          employee_number: String(row["employee_number"]),
          first_name: row["first_name"] || null,
          last_name: row["last_name"] || null,
          email: row["email"] || null,
          department_code: row["department"] || null,
          job_title: row["job_title"] || null,
          grade: row["grade"] || null,
          manager_employee_number: row["manager_employee_number"] || null,
          hire_date: row["hire_date (YYYY-MM-DD)"] || row["hire_date"] || null,
          exit_date: row["exit_date (YYYY-MM-DD or blank)"] || row["exit_date"] || null,
          status: row["status"] || null,
          gender: row["gender"] || null,
          birthdate: row["birthdate (YYYY-MM-DD)"] || row["birthdate"] || null,
          location: row["location"] || null,
          source_file: originalName,
        })
        .onConflict("employee_number")
        .merge()

      processed += 1
    }

    summary.push({
      sheet: "Employees",
      processed_rows: processed,
      failed_rows: errors.length,
      errors,
    })
  }

  const leaveSheet = workbook.getWorksheet("Leave")
  if (leaveSheet) {
    const rows = readWorksheetRows(leaveSheet)
    const errors: SheetSummary["errors"] = []
    let processed = 0

    for (const [index, row] of rows.entries()) {
      if (!row["employee_number"]) {
        errors.push({ row: index + 2, column: "employee_number", message: "missing employee_number" })
        continue
      }

      await db("leave_records").insert({
        id: uuid(),
        employee_number: row["employee_number"],
        leave_type: row["leave_type"] || null,
        start_date: row["start_date (YYYY-MM-DD)"] || row["start_date"] || null,
        end_date: row["end_date (YYYY-MM-DD)"] || row["end_date"] || null,
        working_days: row["working_days"] || null,
        status: row["status"] || null,
        reason: row["reason"] || null,
        source_reference: row["source_reference"] || null,
        source_file: originalName,
      })

      processed += 1
    }

    summary.push({
      sheet: "Leave",
      processed_rows: processed,
      failed_rows: errors.length,
      errors,
    })
  }

  const engagementSheet = workbook.getWorksheet("Engagement")
  if (engagementSheet) {
    const rows = readWorksheetRows(engagementSheet)
    let processed = 0

    for (const row of rows) {
      await db("engagements").insert({
        id: uuid(),
        period: row["period (YYYY-MM)"] || row["period"] || null,
        department_code: row["department_code"] || null,
        metric_name: row["metric_name"] || null,
        metric_value: row["metric_value"] || null,
        source_file: originalName,
      })
      processed += 1
    }

    summary.push({
      sheet: "Engagement",
      processed_rows: processed,
      failed_rows: 0,
    })
  }

  return { file: originalName, sheets: summary }
}

