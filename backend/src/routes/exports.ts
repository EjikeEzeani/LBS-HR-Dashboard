import { Router } from "express"
import { buildPeriodExport } from "../services/exportService"

const router = Router()

router.get("/report", async (req, res) => {
  const period = req.query.period as string
  const format = (req.query.format as string) ?? "excel"

  if (!period) {
    return res.status(400).json({ success: false, error: "period_required" })
  }

  if (format !== "excel") {
    return res.status(400).json({ success: false, error: "unsupported_format" })
  }

  try {
    const buffer = await buildPeriodExport(period)
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", `attachment; filename=\"export_${period}.xlsx\"`)
    return res.send(buffer)
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || "export_failed" })
  }
})

export default router

