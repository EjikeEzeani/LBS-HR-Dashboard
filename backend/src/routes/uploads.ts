import { Router } from "express"
import multer from "multer"
import fs from "fs"
import path from "path"
import { v4 as uuid } from "uuid"
import { parseExcelUpload } from "../services/parser"

const router = Router()

const uploadDir = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads")
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

  const uploadId = uuid()
  try {
    const summary = await parseExcelUpload(req.file.path, req.file.originalname)
    return res.json({ uploadId, summary })
  } catch (error: any) {
    return res.status(500).json({ uploadId, success: false, error: error?.message || "parse_failed" })
  }
})

export default router

