import { Router } from "express"
import { db } from "../db"

const router = Router()

router.get("/uploads", async (req, res) => {
  const status = req.query.status as string | undefined
  let query = db("upload_jobs").orderBy("created_at", "desc").limit(50)
  if (status) {
    query = query.where({ status: status.toUpperCase() })
  }

  const uploads = await query
  res.json({ uploads })
})

router.get("/uploads/:uploadId/errors", async (req, res) => {
  const { uploadId } = req.params
  const errors = await db("upload_errors").where({ upload_id: uploadId }).orderBy("created_at", "desc")
  res.json({ uploadId, errors })
})

router.get("/uploads/:uploadId/errors.csv", async (req, res) => {
  const { uploadId } = req.params
  const errors = await db("upload_errors").where({ upload_id: uploadId }).orderBy("row")
  if (!errors.length) {
    return res.status(404).json({ success: false, error: "no_errors" })
  }
  const header = "sheet,row,column,message,sample\n"
  const lines = errors
    .map((err) => {
      const sample = err.sample ? err.sample.replace(/\"/g, '""') : ""
      return `"${err.sheet}","${err.row}","${err.column}","${err.message}","${sample}"`
    })
    .join("\n")
  res.setHeader("Content-Type", "text/csv")
  res.setHeader("Content-Disposition", `attachment; filename=\"upload_${uploadId}_errors.csv\"`)
  res.send(header + lines)
})

export default router

