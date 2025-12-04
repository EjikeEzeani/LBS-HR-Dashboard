import { db } from "../db"
import { getPeriodRange } from "../utils/period"
import { getCached, setCached } from "../lib/cache"
import { config } from "../config"
import { getPreviousPeriods, splitLeaveAcrossMonths } from "../utils/dates"

const DASHBOARD_PAGES = [
  { id: "overview", title: "Overview", icon: "layout-dashboard" },
  { id: "leave", title: "Leave Analytics", icon: "calendar-check" },
  { id: "vacancies", title: "Vacancies", icon: "briefcase" },
]

export async function getKpiSummary(period: string) {
  const cacheKey = `kpi:${period}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const { start, end } = getPeriodRange(period)
  const headcountRow = await db("employees")
    .count<{ cnt: number }>("id as cnt")
    .where(function () {
      this.whereNull("hire_date").orWhere("hire_date", "<=", end.toISOString())
    })
    .andWhere(function () {
      this.whereNull("exit_date").orWhere("exit_date", ">=", start.toISOString())
    })
    .first()

  const newHiresRow = await db("employees").count<{ cnt: number }>("id as cnt").whereBetween("hire_date", [start.toISOString(), end.toISOString()]).first()
  const exitsRow = await db("employees").count<{ cnt: number }>("id as cnt").whereBetween("exit_date", [start.toISOString(), end.toISOString()]).first()
  const sickDaysRow = await db("leave_records").sum<{ days: number }>("working_days as days").where({ leave_type: "SICK" }).andWhereBetween("start_date", [start.toISOString(), end.toISOString()]).first()

  const vacanciesRows = await db("vacancies").select("posted_date", "filled_date", "status").whereNotNull("posted_date")
  const timeToHireSamples = vacanciesRows
    .filter((v) => v.filled_date)
    .map((v) => (new Date(v.filled_date as any).getTime() - new Date(v.posted_date as any).getTime()) / (1000 * 60 * 60 * 24))

  const avgTimeToHire = timeToHireSamples.length ? timeToHireSamples.reduce((a, b) => a + b, 0) / timeToHireSamples.length : 0

  const vacancyCount = vacanciesRows.filter((v) => !v.filled_date || (v.status && v.status !== "Filled")).length

  const payload = {
    period,
    headcount: Number(headcountRow?.cnt ?? 0),
    new_hires: Number(newHiresRow?.cnt ?? 0),
    exits: Number(exitsRow?.cnt ?? 0),
    turnover_rate: headcountRow?.cnt ? Number(((Number(exitsRow?.cnt ?? 0) / Number(headcountRow.cnt)) * 100).toFixed(2)) : 0,
    sick_days_total: Number(sickDaysRow?.days ?? 0),
    avg_time_to_hire_days: Number(avgTimeToHire.toFixed(1)),
    vacancy_count: vacancyCount,
    pages: DASHBOARD_PAGES,
  }

  setCached(cacheKey, payload)
  return payload
}

export async function getDepartmentKpis(deptId: string, period: string) {
  const cacheKey = `dept:${deptId}:${period}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const { start, end } = getPeriodRange(period)
  const department =
    (await db("departments").where({ id: deptId }).orWhere({ department_code: deptId }).first()) ??
    ({ id: null, name: deptId, department_code: deptId } as any)

  const employees = await db("employees")
    .where(function () {
      this.where("department_id", department.id).orWhere("department_code", department.department_code)
    })
    .andWhere(function () {
      this.whereNull("exit_date").orWhere("exit_date", ">=", start.toISOString())
    })

  const headcount = employees.length
  const genderCounts = employees.reduce(
    (acc, emp) => {
      if (emp.gender?.toLowerCase() === "male") acc.male += 1
      else if (emp.gender?.toLowerCase() === "female") acc.female += 1
      else acc.other += 1
      return acc
    },
    { male: 0, female: 0, other: 0 },
  )

  const avgTenureMonths =
    employees.length > 0
      ? employees.reduce((acc, emp) => {
          if (!emp.hire_date) return acc
          const hire = new Date(emp.hire_date)
          const months = (end.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 30)
          return acc + Math.max(months, 0)
        }, 0) / employees.length
      : 0

  const deptEmployeeNumbers = employees.map((e) => e.employee_number)
  const leaveDaysRow = deptEmployeeNumbers.length
    ? await db("leave_records").whereIn("employee_number", deptEmployeeNumbers).andWhereBetween("start_date", [start.toISOString(), end.toISOString()]).sum<{ days: number }>("working_days as days").first()
    : { days: 0 }

  const engagementRow = await db("engagement_metrics")
    .where(function () {
      this.where("department_id", department.id).orWhere("department_code", department.department_code)
    })
    .andWhere({ period })
    .avg<{ score: number }>("value as score")
    .first()

  const payload = {
    department_id: department.id ?? deptId,
    name: department.name ?? deptId,
    headcount,
    male_pct: headcount ? Number((genderCounts.male / headcount).toFixed(2)) : 0,
    female_pct: headcount ? Number((genderCounts.female / headcount).toFixed(2)) : 0,
    avg_tenure_months: Number(avgTenureMonths.toFixed(1)),
    leave_days: Number(leaveDaysRow?.days ?? 0),
    engagement_score: Number(engagementRow?.score ?? 0),
  }

  setCached(cacheKey, payload)
  return payload
}

export async function getLeaveSummary(period: string, departmentId?: string) {
  const cacheKey = `leave:${period}:${departmentId ?? "all"}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const { start, end } = getPeriodRange(period)
  const leavesQuery = db("leave_records").whereBetween("start_date", [start.toISOString(), end.toISOString()])
  if (departmentId) {
    leavesQuery.whereIn("employee_number", function () {
      this.select("employee_number")
        .from("employees")
        .where(function () {
          this.where("department_id", departmentId).orWhere("department_code", departmentId)
        })
    })
  }
  const leaves = await leavesQuery
  const totalDays = leaves.reduce((acc, leave) => acc + Number(leave.working_days ?? 0), 0)

  const byType = leaves.reduce<Record<string, number>>((acc, leave) => {
    const type = leave.leave_type ?? "OTHER"
    acc[type] = (acc[type] ?? 0) + Number(leave.working_days ?? 0)
    return acc
  }, {})

  const employeeNumbers = leaves.map((l) => l.employee_number).filter(Boolean)
  const employeesByNumber = await db("employees")
    .select("employee_number", "first_name", "last_name", "department_id", "department_code", "status", "manager_employee_number", "grade")
    .whereIn("employee_number", employeeNumbers)

  const managerNumbers = employeesByNumber.map((emp) => emp.manager_employee_number).filter(Boolean) as string[]
  if (managerNumbers.length) {
    const managers = await db("employees").select("employee_number", "first_name", "last_name").whereIn("employee_number", managerNumbers)
    managers.forEach((manager) => {
      if (!employeesByNumber.find((emp) => emp.employee_number === manager.employee_number)) {
        employeesByNumber.push({
          employee_number: manager.employee_number,
          first_name: manager.first_name,
          last_name: manager.last_name,
          department_id: null,
          department_code: null,
          status: null,
          manager_employee_number: null,
        })
      }
    })
  }

  const employeeMap = new Map(employeesByNumber.map((e) => [e.employee_number, e]))
  const departments = await db("departments").select("id", "department_code", "name", "head_id")
  const departmentMap = new Map(departments.map((d) => [d.department_code ?? d.id, d]))

  const byDepartment: Record<string, { days: number; headcount: number; name: string }> = {}
  leaves.forEach((leave) => {
    const employee = employeeMap.get(leave.employee_number)
    const deptKey = employee?.department_code ?? employee?.department_id ?? "unknown"
    const dept = departmentMap.get(employee?.department_code ?? "") ?? { name: deptKey }
    if (!byDepartment[deptKey]) {
      const headcount = employeesByNumber.filter(
        (emp) => emp.department_code === employee?.department_code || emp.department_id === employee?.department_id,
      ).length
      byDepartment[deptKey] = { days: 0, headcount, name: dept?.name ?? deptKey }
    }
    byDepartment[deptKey].days += Number(leave.working_days ?? 0)
  })

  const periods = getPreviousPeriods(period, 12)
  const trendSeries = periods.map((p) => ({ period: p, days: 0 }))
  const periodIndex = new Map(trendSeries.map((p, idx) => [p.period, idx]))

  leaves.forEach((leave) => {
    if (!leave.start_date || !leave.end_date) return
    const startDate = new Date(leave.start_date)
    const endDate = new Date(leave.end_date)
    const segments = splitLeaveAcrossMonths(startDate, endDate, config.holidays)
    Object.entries(segments).forEach(([periodKey, days]) => {
      const idx = periodIndex.get(periodKey)
      if (idx !== undefined) {
        trendSeries[idx].days += days
      }
    })
  })

  const hotspots = await db("leave_records")
    .select("employee_number")
    .sum("working_days as days")
    .whereBetween("start_date", [start.toISOString(), end.toISOString()])
    .groupBy("employee_number")
    .orderByRaw("SUM(working_days) DESC")
    .limit(10)

  const pendingRows = await db("leave_records")
    .where({ status: "PENDING" })
    .andWhereBetween("start_date", [start.toISOString(), end.toISOString()])
    .select("id", "employee_number", "start_date", "end_date", "status")
    .limit(20)

  const pending = pendingRows.map((leave) => {
    const employee = employeeMap.get(leave.employee_number)
    return {
      leave_id: leave.id,
      employee_number: leave.employee_number,
      start: leave.start_date,
      end: leave.end_date,
      status: leave.status,
      manager_id: employee?.manager_employee_number ?? null,
    }
  })

  const pendingByManagerMap = new Map<
    string,
    { manager_id: string; manager_name: string; pending_count: number; requests: { employee_number: string; leave_id: string }[] }
  >()
  pending.forEach((leave) => {
    const employee = employeeMap.get(leave.employee_number)
    const managerId = employee?.manager_employee_number ?? "unassigned"
    const manager = managerId !== "unassigned" ? employeeMap.get(managerId) : null
    const managerName =
      managerId === "unassigned"
        ? "Unassigned"
        : manager
          ? `${manager.first_name ?? ""} ${manager.last_name ?? ""}`.trim()
          : managerId
    if (!pendingByManagerMap.has(managerId)) {
      pendingByManagerMap.set(managerId, { manager_id: managerId, manager_name: managerName, pending_count: 0, requests: [] })
    }
    const entry = pendingByManagerMap.get(managerId)!
    entry.pending_count += 1
    entry.requests.push({ employee_number: leave.employee_number, leave_id: leave.leave_id })
  })
  const pendingByManager = Array.from(pendingByManagerMap.values())

  const calendarFeed = leaves
    .filter((leave) => leave.status === "APPROVED" || leave.status === "Approved")
    .slice(0, 50)
    .map((leave) => {
      const employee = employeeMap.get(leave.employee_number)
      return {
        start: leave.start_date,
        end: leave.end_date,
        employee: employee ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() : leave.employee_number,
        type: leave.leave_type,
        status: leave.status,
      }
    })

  const leaveBalanceByEmployee = employeesByNumber.slice(0, 20).map((employee) => {
    const entitlement = Number(employee.grade?.includes("Senior") ? 25 : 20)
    const taken = leaves
      .filter((leave) => leave.employee_number === employee.employee_number)
      .reduce((acc, leave) => acc + Number(leave.working_days ?? 0), 0)
    return {
      employee_number: employee.employee_number,
      employee_name: `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim(),
      entitlement,
      taken,
      balance: Math.max(entitlement - taken, 0),
    }
  })

  const utilizationRate = leaveBalanceByEmployee.length
    ? Number(((leaveBalanceByEmployee.reduce((acc, emp) => acc + emp.taken, 0) / (leaveBalanceByEmployee.reduce((acc, emp) => acc + emp.entitlement, 0) || 1)) * 100).toFixed(1))
    : 0

  const trendDirection =
    trendSeries.length >= 2 && trendSeries[trendSeries.length - 2].days !== undefined
      ? trendSeries[trendSeries.length - 1].days >= trendSeries[trendSeries.length - 2].days
        ? "increasing"
        : "decreasing"
      : "flat"

  const payload = {
    period,
    total_working_days_lost: Number(totalDays.toFixed(1)),
    by_type: Object.entries(byType).map(([type, days]) => ({
      type,
      days: Number(days.toFixed(1)),
      percent: totalDays ? Number(((days / totalDays) * 100).toFixed(1)) : 0,
    })),
    by_department: Object.entries(byDepartment).map(([deptKey, value]) => ({
      department_id: deptKey,
      name: value.name,
      days: Number(value.days.toFixed(1)),
      headcount: value.headcount,
      days_per_100_employees: value.headcount ? Number(((value.days / value.headcount) * 100).toFixed(1)) : 0,
    })),
    trend_series: trendSeries,
    trend_direction: trendDirection,
    hotspots: hotspots.map((hotspot) => {
      const employee = employeeMap.get(hotspot.employee_number)
      const dept = departmentMap.get(employee?.department_code ?? "")
      return {
        employee_number: hotspot.employee_number,
        employee_name: employee ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() : hotspot.employee_number,
        days: Number(hotspot.days ?? 0),
        department: dept?.name ?? employee?.department_code ?? "Unknown",
      }
    }),
    leave_balance_by_employee: leaveBalanceByEmployee,
    utilization_rate: utilizationRate,
    pending_approval_count: pending.length,
    pending_by_manager: pendingByManager,
    pending,
    calendar_feed: calendarFeed,
  }

  setCached(cacheKey, payload)
  return payload
}

