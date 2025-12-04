import XLSX from "xlsx"
import { Knex } from "knex"
import { v4 as uuid } from "uuid"
import { db } from "../db"
import { normalizeDate, workingDaysBetween } from "../utils/dates"
import { ParserError } from "../utils/errors"
import { config } from "../config"

type SheetError = { sheet: string; row: number; column: string; message: string }

type SheetSummary = {
  sheet: string
  processed_rows: number
  failed_rows: number
  mapping?: string
  errors: SheetError[]
}

type ParseResult = {
  file: string
  sheets: SheetSummary[]
  processedRows: number
  failedRows: number
  errors: SheetError[]
  period?: { start?: string; end?: string }
}

type ParseOptions = {
  originalName: string
  uploadId: string
  metadata: Record<string, any>
}

const TEMPLATE_COLUMNS: Record<string, string[]> = {
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

const REQUIRED_TEMPLATE_SHEETS = ["Employees", "Departments", "Leave", "UploadMetadata"]

type InternalContext = {
  uploadId: string
  originalName: string
  metadata: Record<string, any>
  holidays: string[]
  period?: { start?: string; end?: string }
}

export async function parseExcelUpload(filePath: string, options: ParseOptions): Promise<ParseResult> {
  const workbook = XLSX.readFile(filePath, { cellDates: true })
  const hasUploadMetadata = workbook.SheetNames.includes("UploadMetadata")
  const missingRequiredSheets = REQUIRED_TEMPLATE_SHEETS.filter((sheet) => !workbook.SheetNames.includes(sheet))
  if (hasUploadMetadata && missingRequiredSheets.length) {
    throw new ParserError("missing_sheet", missingRequiredSheets.map((sheet) => ({ sheet, message: "required_sheet_missing" })))
  }
  const ctx: InternalContext = {
    uploadId: options.uploadId,
    originalName: options.originalName,
    metadata: options.metadata,
    holidays: [...config.holidays, ...(options.metadata?.holidays ?? [])],
  }

  const summary: SheetSummary[] = []
  const globalErrors: SheetError[] = []
  let processedRows = 0
  let failedRows = 0

  const trx = await db.transaction()

  try {
    if (isTemplateWorkbook(workbook)) {
      await parseTemplateWorkbook(workbook, trx, ctx, {
        pushSummary: (item) => summary.push(item),
        recordError: (error) => {
          globalErrors.push(error)
          failedRows += 1
        },
        incrementProcessed: (count = 1) => {
          processedRows += count
        },
      })
    } else {
      await parseVendorWorkbook(workbook, trx, ctx, {
        pushSummary: (item) => summary.push(item),
        recordError: (error) => {
          globalErrors.push(error)
          failedRows += 1
        },
        incrementProcessed: (count = 1) => {
          processedRows += count
        },
      })
    }

    const erroredSheets = summary.filter((sheet) => sheet.failed_rows > 0)
    if (erroredSheets.length) {
      const details = erroredSheets.flatMap((sheet) => sheet.errors)
      throw new ParserError("validation_failed", details.length ? details : erroredSheets.map((item) => ({ sheet: item.sheet, row: 0, column: "*", message: "sheet_failed" })))
    }

    await trx.commit()
  } catch (error) {
    await trx.rollback()
    throw error
  }

  return {
    file: options.originalName,
    sheets: summary,
    processedRows,
    failedRows,
    errors: globalErrors,
    period: ctx.period,
  }
}

function isTemplateWorkbook(workbook: XLSX.WorkBook) {
  return REQUIRED_TEMPLATE_SHEETS.every((sheet) => workbook.SheetNames.includes(sheet))
}

function getHeaders(sheet: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false })
  if (!rows.length) return []
  return rows[0].map((cell) => (cell ?? "").toString().trim())
}

async function parseTemplateWorkbook(
  workbook: XLSX.WorkBook,
  trx: Knex.Transaction,
  ctx: InternalContext,
  hooks: { pushSummary: (item: SheetSummary) => void; recordError: (error: any) => void; incrementProcessed: (count?: number) => void },
) {
  const departmentMap = new Map<string, string>()
  const employeeMap = new Map<string, string>()

  // metadata first
  const metadataSheet = workbook.Sheets["UploadMetadata"]
  if (metadataSheet) {
    validateColumnsOrThrow(metadataSheet, TEMPLATE_COLUMNS.UploadMetadata, "UploadMetadata")
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(metadataSheet, { defval: "" })
    const metaRow = rows[0] ?? {}
    ctx.period = {
      start: normalizeDate(metaRow["reporting_period_start"]) ?? ctx.metadata?.reporting_period_start ?? null,
      end: normalizeDate(metaRow["reporting_period_end"]) ?? ctx.metadata?.reporting_period_end ?? null,
    }
    hooks.pushSummary({ sheet: "UploadMetadata", processed_rows: rows.length, failed_rows: 0, errors: [] })
  } else {
    throw new ParserError("missing_sheet", [{ sheet: "UploadMetadata", message: "UploadMetadata sheet is required" }])
  }

  for (const sheetName of Object.keys(TEMPLATE_COLUMNS)) {
    if (sheetName === "UploadMetadata") continue
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      if (["Sickbay", "Onboarding", "Exits", "Vacancies", "Engagement", "StatutoryCompliance", "L&D"].includes(sheetName)) {
        continue
      }
      throw new ParserError("missing_sheet", [{ sheet: sheetName, message: `${sheetName} sheet missing` }])
    }
    validateColumnsOrThrow(sheet, TEMPLATE_COLUMNS[sheetName], sheetName)
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" })
    const errors: SheetError[] = []
    let processed = 0

    for (const [index, rawRow] of rows.entries()) {
      const row = cleanRow(rawRow)
      const rowNumber = index + 2 // header row offset
      const provenance = `${ctx.originalName}:${sheetName}!${rowNumber}`
      try {
        switch (sheetName) {
          case "Departments":
            await upsertDepartment(row, trx, ctx, departmentMap, provenance)
            break
          case "Employees":
            await upsertEmployee(row, trx, ctx, departmentMap, employeeMap, provenance)
            break
          case "Leave":
            await insertLeave(row, trx, ctx, employeeMap, provenance, errors)
            break
          case "L&D":
            await insertTraining(row, trx, ctx, employeeMap, provenance)
            break
          case "Sickbay":
            await insertSickbay(row, trx, ctx, employeeMap, provenance)
            break
          case "Onboarding":
            await insertOnboarding(row, trx, ctx, employeeMap, provenance)
            break
          case "Exits":
            await insertExit(row, trx, ctx, employeeMap, provenance)
            break
          case "Vacancies":
            await insertVacancy(row, trx, ctx, departmentMap, provenance)
            break
          case "Engagement":
            await insertEngagement(row, trx, ctx, departmentMap, provenance)
            break
          case "StatutoryCompliance":
            await insertStatutory(row, trx, ctx, provenance)
            break
          default:
            break
        }
        processed += 1
        hooks.incrementProcessed()
      } catch (err: any) {
        errors.push({ sheet: sheetName, row: rowNumber, column: err?.column ?? "n/a", message: err?.message ?? "row_failed" })
        await recordUploadError(trx, ctx.uploadId, sheetName, rowNumber, err?.column ?? "n/a", err?.message ?? "row_failed", row)
      }
    }

    hooks.pushSummary({
      sheet: sheetName,
      processed_rows: processed,
      failed_rows: errors.length,
      errors,
    })
  }
}

async function parseVendorWorkbook(
  workbook: XLSX.WorkBook,
  trx: Knex.Transaction,
  ctx: InternalContext,
  hooks: { pushSummary: (item: SheetSummary) => void; recordError: (error: any) => void; incrementProcessed: (count?: number) => void },
) {
  const mappingLogs: SheetSummary[] = []
  let matchedSheets = 0
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const headers = getHeaders(sheet).map((h) => h.toLowerCase())
    if (!headers.length) continue

    if (headers.includes("employee number") || headers.includes("staff no") || headers.includes("employee_no")) {
      matchedSheets += 1
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" })
      let processed = 0
      const errors: SheetError[] = []
      for (const [index, rawRow] of rows.entries()) {
        const row = cleanRow(rawRow)
        const rowNumber = index + 2
        const provenance = `${ctx.originalName}:${sheetName}!${rowNumber}`
        const employeeNumber = row["Employee Number"] ?? row["employee number"] ?? row["Staff No"] ?? row["EMPLOYEE_NO"]
        if (!employeeNumber) {
          errors.push({ sheet: sheetName, row: rowNumber, column: "employee_number", message: "missing employee number" })
          await recordUploadError(trx, ctx.uploadId, sheetName, rowNumber, "employee_number", "missing employee number", row)
          continue
        }

        await upsertEmployee(
          {
            employee_number: employeeNumber,
            first_name: row["First Name"] ?? row["FIRSTNAME"] ?? row["Given Name"] ?? "",
            last_name: row["Last Name"] ?? row["LASTNAME"] ?? row["Surname"] ?? "",
            department: row["Department"] ?? row["Dept"],
            job_title: row["Job Title"] ?? row["Role"],
            status: row["Status"] ?? "Active",
            hire_date: row["Hire Date"] ?? row["Join Date"],
            exit_date: row["Exit Date"],
          },
          trx,
          ctx,
          new Map(),
          new Map(),
          provenance,
          true,
        )
        processed += 1
        hooks.incrementProcessed()
      }
      mappingLogs.push({
        sheet: sheetName,
        processed_rows: processed,
        failed_rows: errors.length,
        mapping: "vendor_employee_auto",
        errors,
      })
      continue
    }

    if (headers.includes("leave type") || headers.includes("start date")) {
      matchedSheets += 1
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" })
      let processed = 0
      const errors: SheetError[] = []
      for (const [index, rawRow] of rows.entries()) {
        const row = cleanRow(rawRow)
        const rowNumber = index + 2
        const provenance = `${ctx.originalName}:${sheetName}!${rowNumber}`
        const employeeNumber = row["Employee Number"] ?? row["employee number"] ?? row["Staff No"]
        if (!employeeNumber) {
          errors.push({ sheet: sheetName, row: rowNumber, column: "employee_number", message: "missing employee number" })
          await recordUploadError(trx, ctx.uploadId, sheetName, rowNumber, "employee_number", "missing employee number", row)
          continue
        }
        await insertLeave(
          {
            employee_number: employeeNumber,
            leave_type: row["Leave Type"] ?? row["Type"],
            start_date: row["Start Date"] ?? row["From"],
            end_date: row["End Date"] ?? row["To"],
            working_days: row["Working Days"] ?? row["Days"],
            status: row["Status"] ?? "Approved",
            reason: row["Reason"],
            source_reference: row["Ref"],
          },
          trx,
          ctx,
          new Map(),
          provenance,
          errors,
        )
        processed += 1
        hooks.incrementProcessed()
      }
      mappingLogs.push({
        sheet: sheetName,
        processed_rows: processed,
        failed_rows: errors.length,
        mapping: "vendor_leave_auto",
        errors,
      })
      continue
    }
  }

  if (!matchedSheets) {
    throw new ParserError("template_or_vendor_sheet_not_detected", [{ sheet: "all", message: "No recognizable tables detected" }])
  }

  mappingLogs.forEach((log) => hooks.pushSummary(log))
}

function validateColumnsOrThrow(sheet: XLSX.WorkSheet, expectedColumns: string[], sheetName: string) {
  const headers = getHeaders(sheet)
  const normalized = headers.map((h) => h.trim())
  const missing = expectedColumns.filter((col) => !normalized.includes(col))
  const extras = normalized.filter((col) => !expectedColumns.includes(col))
  if (missing.length || extras.length) {
    throw new ParserError("invalid_columns", [
      {
        sheet: sheetName,
        message: "Column mismatch",
        missing,
        extras,
      },
    ])
  }
}

function cleanRow(row: Record<string, any>) {
  const cleaned: Record<string, any> = {}
  Object.entries(row).forEach(([key, value]) => {
    if (typeof value === "string") {
      cleaned[key.trim()] = value.trim()
    } else {
      cleaned[key.trim()] = value
    }
  })
  return cleaned
}

async function recordUploadError(trx: Knex.Transaction, uploadId: string, sheet: string, row: number, column: string, message: string, sample: Record<string, any>) {
  await trx("upload_errors").insert({
    id: uuid(),
    upload_id: uploadId,
    sheet,
    row,
    column,
    message,
    sample: JSON.stringify(sample),
  })
}

async function upsertDepartment(
  row: Record<string, any>,
  trx: Knex.Transaction,
  ctx: InternalContext,
  departmentMap: Map<string, string>,
  source: string,
) {
  const code = row["department_code"]
  if (!code) throw new ParserError("missing_department_code", [{ sheet: "Departments", column: "department_code", message: "Department code required" }])

  let existing = await trx("departments").where({ department_code: code }).first("id")
  if (existing) {
    await trx("departments")
      .where({ id: existing.id })
      .update({
        name: row["department_name"] || row["name"] || code,
        head_id: row["head_employee_number"] || null,
        parent_department_id: row["parent_department_code"] || null,
        source_file: source,
        upload_id: ctx.uploadId,
        updated_at: new Date().toISOString(),
      })
    departmentMap.set(code, existing.id)
    return
  }

  const id = uuid()
  await trx("departments").insert({
    id,
    department_code: code,
    name: row["department_name"] || code,
    head_id: row["head_employee_number"] || null,
    parent_department_id: row["parent_department_code"] || null,
    source_file: source,
    upload_id: ctx.uploadId,
  })
  departmentMap.set(code, id)
}

async function upsertEmployee(
  row: Record<string, any>,
  trx: Knex.Transaction,
  ctx: InternalContext,
  departmentMap: Map<string, string>,
  employeeMap: Map<string, string>,
  source: string,
  allowPartial = false,
) {
  const employeeNumber = row["employee_number"]
  if (!employeeNumber && !allowPartial) {
    throw new ParserError("missing_employee_number", [{ sheet: "Employees", column: "employee_number", message: "employee_number required" }])
  }
  if (!employeeNumber) return
  const departmentCode = row["department"]
  let departmentId: string | null = null
  if (departmentCode && departmentMap.has(departmentCode)) {
    departmentId = departmentMap.get(departmentCode) ?? null
  }

  const hireDate = normalizeDate(row["hire_date (YYYY-MM-DD)"] ?? row["hire_date"])
  const exitDate = normalizeDate(row["exit_date (YYYY-MM-DD or blank)"] ?? row["exit_date"])

  let existing = await trx("employees").where({ employee_number: employeeNumber }).first("id")
  if (existing) {
    await trx("employees")
      .where({ id: existing.id })
      .update({
        first_name: row["first_name"] || row["first_name "] || row["first"] || null,
        last_name: row["last_name"] || row["last"] || null,
        email: row["email"] || null,
        department_id: departmentId,
        department_code: departmentCode || null,
        job_title: row["job_title"] || row["role"] || null,
        grade: row["grade"] || null,
        manager_employee_number: row["manager_employee_number"] || null,
        hire_date: hireDate,
        exit_date: exitDate,
        status: row["status"] || row["Status"] || null,
        gender: row["gender"] || null,
        birthdate: normalizeDate(row["birthdate (YYYY-MM-DD)"] ?? row["birthdate"]),
        location: row["location"] || null,
        source_file: source,
        upload_id: ctx.uploadId,
        updated_at: new Date().toISOString(),
      })
    employeeMap.set(employeeNumber, existing.id)
    return
  }

  const id = uuid()
  await trx("employees").insert({
    id,
    employee_number: employeeNumber,
    first_name: row["first_name"] || null,
    last_name: row["last_name"] || null,
    email: row["email"] || null,
    department_id: departmentId,
    department_code: departmentCode || null,
    job_title: row["job_title"] || null,
    grade: row["grade"] || null,
    manager_employee_number: row["manager_employee_number"] || null,
    hire_date: hireDate,
    exit_date: exitDate,
    status: row["status"] || null,
    gender: row["gender"] || null,
    birthdate: normalizeDate(row["birthdate (YYYY-MM-DD)"] ?? row["birthdate"]),
    location: row["location"] || null,
    source_file: source,
    upload_id: ctx.uploadId,
  })
  employeeMap.set(employeeNumber, id)
}

async function insertLeave(
  row: Record<string, any>,
  trx: Knex.Transaction,
  ctx: InternalContext,
  employeeMap: Map<string, string>,
  source: string,
  errors: SheetError[] | undefined,
) {
  const employeeNumber = row["employee_number"]
  if (!employeeNumber) {
    throw new ParserError("missing_employee_number", [{ sheet: "Leave", column: "employee_number", message: "employee_number required" }])
  }
  const startDateIso = normalizeDate(row["start_date (YYYY-MM-DD)"] ?? row["start_date"])
  const endDateIso = normalizeDate(row["end_date (YYYY-MM-DD)"] ?? row["end_date"])
  if (!startDateIso || !endDateIso) {
    throw new ParserError("invalid_dates", [{ sheet: "Leave", column: "start_date", message: "start and end date required" }])
  }
  const startDate = new Date(startDateIso)
  const endDate = new Date(endDateIso)
  const workingDays =
    Number(row["working_days"]) ||
    Number(row["working_days "] || 0) ||
    workingDaysBetween(startDate, endDate, ctx.holidays)

  const employeeId =
    employeeMap.get(employeeNumber) ??
    (await trx("employees").where({ employee_number: employeeNumber }).first("id").then((r) => r?.id ?? null))

  const overlap = await trx("leave_records")
    .where({ employee_number: employeeNumber })
    .andWhereRaw("NOT (? < start_date OR ? > end_date)", [startDateIso, endDateIso])
    .first("id")

  if (overlap) {
    // skip duplicate overlap and log informational error
    const rowNumber = Number(source.split("!")[1]) || 0
    errors?.push({ sheet: "Leave", row: rowNumber, column: "date_range", message: "duplicate_overlap_skipped" })
    return
  }

  await trx("leave_records")
    .insert({
      id: uuid(),
      employee_id: employeeId,
      employee_number: employeeNumber,
      leave_type: (row["leave_type"] || "Other").toUpperCase(),
      start_date: startDateIso,
      end_date: endDateIso,
      working_days: workingDays,
      status: row["status"] || "Approved",
      reason: row["reason"] || null,
      source_reference: row["source_reference"] || null,
      source_file: source,
      upload_id: ctx.uploadId,
    })
    .onConflict(["employee_number", "start_date", "end_date"])
    .merge(["leave_type", "working_days", "status", "reason", "source_reference", "source_file", "upload_id"])
}

async function insertTraining(
  row: Record<string, any>,
  trx: Knex.Transaction,
  ctx: InternalContext,
  employeeMap: Map<string, string>,
  source: string,
) {
  if (!row["employee_number"]) return
  const employeeId =
    employeeMap.get(row["employee_number"]) ??
    (await trx("employees").where({ employee_number: row["employee_number"] }).first("id").then((r) => r?.id ?? null))
  await trx("training_records").insert({
    id: uuid(),
    employee_id: employeeId,
    employee_number: row["employee_number"],
    course_name: row["course_name"] || null,
    start_date: normalizeDate(row["start_date"]) || null,
    end_date: normalizeDate(row["end_date"]) || null,
    status: row["status"] || null,
    cost: row["cost"] ? Number(row["cost"]) : null,
    provider: row["provider"] || null,
    notes: row["notes"] || null,
    source_file: source,
    upload_id: ctx.uploadId,
  })
}

async function insertSickbay(
  row: Record<string, any>,
  trx: Knex.Transaction,
  ctx: InternalContext,
  employeeMap: Map<string, string>,
  source: string,
) {
  if (!row["employee_number"]) return
  const employeeId =
    employeeMap.get(row["employee_number"]) ??
    (await trx("employees").where({ employee_number: row["employee_number"] }).first("id").then((r) => r?.id ?? null))
  await trx("sickbay_records").insert({
    id: uuid(),
    employee_id: employeeId,
    employee_number: row["employee_number"],
    date: normalizeDate(row["date (YYYY-MM-DD)"] ?? row["date"]),
    hours_off: row["hours_off"] ? Number(row["hours_off"]) : null,
    reason: row["reason"] || null,
    approved_by: row["approved_by_employee_number"] || null,
    source_file: source,
    upload_id: ctx.uploadId,
  })
}

async function insertOnboarding(
  row: Record<string, any>,
  trx: Knex.Transaction,
  ctx: InternalContext,
  employeeMap: Map<string, string>,
  source: string,
) {
  if (!row["employee_number"]) return
  const employeeId =
    employeeMap.get(row["employee_number"]) ??
    (await trx("employees").where({ employee_number: row["employee_number"] }).first("id").then((r) => r?.id ?? null))
  await trx("onboarding_records").insert({
    id: uuid(),
    employee_id: employeeId,
    employee_number: row["employee_number"],
    onboard_date: normalizeDate(row["onboard_date"]) || null,
    activity: row["activity"] || null,
    status: row["status"] || null,
    source_file: source,
    upload_id: ctx.uploadId,
  })
}

async function insertExit(
  row: Record<string, any>,
  trx: Knex.Transaction,
  ctx: InternalContext,
  employeeMap: Map<string, string>,
  source: string,
) {
  if (!row["employee_number"]) return
  const employeeId =
    employeeMap.get(row["employee_number"]) ??
    (await trx("employees").where({ employee_number: row["employee_number"] }).first("id").then((r) => r?.id ?? null))
  await trx("exit_records").insert({
    id: uuid(),
    employee_id: employeeId,
    employee_number: row["employee_number"],
    exit_date: normalizeDate(row["exit_date"]) || null,
    reason: row["reason"] || null,
    notice_period: row["notice_period_days"] ? Number(row["notice_period_days"]) : null,
    last_working_date: normalizeDate(row["last_working_date"]) || null,
    source_file: source,
    upload_id: ctx.uploadId,
  })
}

async function insertVacancy(
  row: Record<string, any>,
  trx: Knex.Transaction,
  ctx: InternalContext,
  departmentMap: Map<string, string>,
  source: string,
) {
  const departmentCode = row["department_code"]
  const departmentId = departmentCode ? departmentMap.get(departmentCode) ?? null : null
  await trx("vacancies").insert({
    id: uuid(),
    department_id: departmentId,
    department_code: departmentCode || null,
    vacancy_code: row["vacancy_id"] || null,
    cadre: row["cadre"] || null,
    status: row["status"] || null,
    posted_date: normalizeDate(row["posted_date"]) || null,
    filled_date: normalizeDate(row["filled_date"]) || null,
    cost_per_hire: row["cost_per_hire"] ? Number(row["cost_per_hire"]) : null,
    source_file: source,
    upload_id: ctx.uploadId,
  })
}

async function insertEngagement(
  row: Record<string, any>,
  trx: Knex.Transaction,
  ctx: InternalContext,
  departmentMap: Map<string, string>,
  source: string,
) {
  const departmentCode = row["department_code"]
  const departmentId = departmentCode ? departmentMap.get(departmentCode) ?? null : null
  await trx("engagement_metrics")
    .insert({
      id: uuid(),
      period: row["period (YYYY-MM)"] || row["period"] || ctx.period?.start || null,
      metric_name: row["metric_name"] || null,
      value: row["metric_value"] ? Number(row["metric_value"]) : null,
      department_id: departmentId,
      department_code: departmentCode || null,
      source_file: source,
      upload_id: ctx.uploadId,
    })
    .onConflict(["period", "metric_name", "department_code"])
    .merge(["value", "source_file", "upload_id"])
}

async function insertStatutory(row: Record<string, any>, trx: Knex.Transaction, ctx: InternalContext, source: string) {
  await trx("statutory_compliance").insert({
    id: uuid(),
    item: row["item"] || null,
    due_date: normalizeDate(row["due_date"]) || null,
    status: row["status"] || null,
    notes: row["notes"] || null,
    source_file: source,
    upload_id: ctx.uploadId,
  })
}

