import { Router } from "express"
import { db } from "../db"

const router = Router()

router.get("/kpis", async (req, res) => {
  const period = (req.query.period as string) ?? null
  const headcountRow = await db("employees").count<{ cnt: number }>("id as cnt").first()
  const sickDays = await db("leave_records").sum<{ days: number }>("working_days as days").first()
  res.json({
    period,
    headcount: Number(headcountRow?.cnt ?? 0),
    sick_days_total: Number(sickDays?.days ?? 0),
  })
})

router.get("/department/:deptId", async (req, res) => {
  const { deptId } = req.params
  const period = (req.query.period as string) ?? null
  const headcountRow = await db("employees").where({ department_code: deptId }).count<{ cnt: number }>("id as cnt").first()
  res.json({
    department_id: deptId,
    period,
    headcount: Number(headcountRow?.cnt ?? 0),
  })
})

export default router

