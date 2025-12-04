import { Router } from "express"
import { getLeaveSummary } from "../services/analyticsService"

const router = Router()

router.get("/summary", async (req, res) => {
  const period = (req.query.period as string) ?? new Date().toISOString().slice(0, 7)
  const departmentId = req.query.department_id as string | undefined
  try {
    const payload = await getLeaveSummary(period, departmentId)
    res.json(payload)
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message ?? "leave_summary_error" })
  }
})

export default router

