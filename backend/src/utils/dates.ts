import { parse, parseISO, isValid } from "date-fns"

const DATE_FORMATS = ["yyyy-MM-dd", "MM/dd/yyyy", "dd/MM/yyyy", "yyyy/MM/dd"]

export function normalizeDate(value: any): string | null {
  if (!value) return null
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString()
  }
  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30))
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000)
    return date.toISOString()
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return null
    const iso = parseISO(trimmed)
    if (isValid(iso)) return iso.toISOString()
    for (const format of DATE_FORMATS) {
      const parsed = parse(trimmed, format, new Date())
      if (isValid(parsed)) {
        return parsed.toISOString()
      }
    }
  }
  return null
}

export function workingDaysBetween(start: Date, end: Date, holidays: string[] = []): number {
  const startTime = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const endTime = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  if (endTime < startTime) return 0

  const holidaySet = new Set(holidays.map((h) => h.slice(0, 10)))
  let count = 0
  for (let time = startTime; time <= endTime; time += 86400000) {
    const date = new Date(time)
    const day = date.getUTCDay()
    const key = date.toISOString().slice(0, 10)
    if (day === 0 || day === 6) continue
    if (holidaySet.has(key)) continue
    count += 1
  }
  return count
}

export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

export function splitLeaveAcrossMonths(start: Date, end: Date, holidays: string[] = []) {
  const segments: Record<string, number> = {}
  const holidaySet = new Set(holidays.map((h) => h.slice(0, 10)))
  const startTime = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const endTime = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  for (let time = startTime; time <= endTime; time += 86400000) {
    const date = new Date(time)
    const day = date.getUTCDay()
    const key = date.toISOString().slice(0, 10)
    if (day === 0 || day === 6) continue
    if (holidaySet.has(key)) continue
    const period = monthKey(date)
    segments[period] = (segments[period] ?? 0) + 1
  }
  return segments
}

export function getPreviousPeriods(latestPeriod: string, months = 12) {
  const [yearStr, monthStr] = latestPeriod.split("-")
  let year = Number(yearStr)
  let month = Number(monthStr)
  const result: string[] = []
  for (let i = months - 1; i >= 0; i -= 1) {
    let y = year
    let m = month - i
    while (m <= 0) {
      m += 12
      y -= 1
    }
    result.push(`${y}-${String(m).padStart(2, "0")}`)
  }
  return result
}

