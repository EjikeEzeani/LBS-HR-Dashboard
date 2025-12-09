import { Router } from "express"
import { db } from "../db"

const router = Router()

router.get("/summary", async (req, res) => {
  const period = (req.query.period as string) ?? null
  const total = await db("leave_records").sum<{ total: number }>("working_days as total").first()
  const byType = await db("leave_records").select("leave_type as type").sum("working_days as days").groupBy("leave_type")

  res.json({
    period,
    total_working_days_lost: Number(total?.total ?? 0),
    by_type: byType.map((row: any) => ({
      type: row.type,
      days: Number(row.days ?? 0),
    })),
  })
})

export default router

