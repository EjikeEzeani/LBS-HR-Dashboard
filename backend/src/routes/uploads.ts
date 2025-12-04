import { Router } from "express"
import multer from "multer"
import fs from "fs"
import path from "path"
import { v4 as uuid } from "uuid"
import { handleExcelUpload } from "../services/uploadService"
import { uploadEvents } from "../events/uploadEvents"
import { config } from "../config"
import { db } from "../db"

const router = Router()

const uploadDir = config.uploadsDir
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})

const upload = multer({ storage })

router.post("/excel", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, errors: [{ message: "file_required" }] })
  }

  const uploader = (req as any).user?.email ?? req.header("x-uploaded-by") ?? "api"
  let metadata: Record<string, any> | undefined
  if (req.body?.metadata) {
    try {
      metadata = JSON.parse(req.body.metadata)
    } catch (err) {
      return res.status(400).json({ success: false, errors: [{ message: "metadata_invalid" }] })
    }
  }

  try {
    const result = await handleExcelUpload(req.file.path, req.file.originalname, { uploader, metadata })
    return res.json(result)
  } catch (error: any) {
    const status = error?.details ? 400 : 500
    return res.status(status).json({
      success: false,
      error: error?.message || "upload_failed",
      errors: error?.details,
    })
  }
})

router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.flushHeaders?.()

  const listener = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  uploadEvents.on("upload", listener)

  req.on("close", () => {
    uploadEvents.off("upload", listener)
  })
})

router.get("/:uploadId/status", async (req, res) => {
  const { uploadId } = req.params
  const upload = await db("upload_jobs").where({ id: uploadId }).first()
  if (!upload) {
    return res.status(404).json({ success: false, error: "upload_not_found" })
  }
  const errors = await db("upload_errors").where({ upload_id: uploadId }).orderBy("row")
  res.json({
    uploadId,
    status: upload.status,
    processed_rows: upload.processed_rows,
    failed_rows: upload.failed_rows,
    errors,
  })
})

export default router

