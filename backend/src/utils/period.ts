export function getPeriodRange(period: string) {
  const [yearStr, monthStr] = period.split("-")
  const year = Number(yearStr)
  const month = Number(monthStr)
  if (!year || !month) {
    throw new Error("invalid_period")
  }
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
  return { start, end }
}

