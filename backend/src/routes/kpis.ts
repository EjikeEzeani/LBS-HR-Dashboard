import { Router } from "express"
import { getKpiSummary, getDepartmentKpis } from "../services/analyticsService"

const router = Router()

router.get("/kpis", async (req, res) => {
  const period = (req.query.period as string) ?? new Date().toISOString().slice(0, 7)
  try {
    const payload = await getKpiSummary(period)
    res.json(payload)
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message ?? "kpi_error" })
  }
})

router.get("/department/:deptId", async (req, res) => {
  const { deptId } = req.params
  const period = (req.query.period as string) ?? new Date().toISOString().slice(0, 7)
  try {
    const payload = await getDepartmentKpis(deptId, period)
    res.json(payload)
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message ?? "department_kpi_error" })
  }
})

export default router

