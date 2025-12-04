import fs from "fs"
import { v4 as uuid } from "uuid"
import { db } from "../db"
import { parseExcelUpload } from "./parser"
import { uploadEvents } from "../events/uploadEvents"
import { notifySubscribers } from "../routes/webhook"
import { flushCache } from "../lib/cache"
import { config } from "../config"

type UploadOptions = {
  uploader?: string
  metadata?: Record<string, any>
}

export async function handleExcelUpload(filePath: string, originalName: string, opts: UploadOptions = {}) {
  const uploadId = uuid()
  const metadataJson = opts.metadata ? JSON.stringify(opts.metadata) : null
  await db("upload_jobs").insert({
    id: uploadId,
    filename: originalName,
    uploader: opts.uploader ?? "api",
    status: "PROCESSING",
    metadata: metadataJson,
  })

  try {
    const result = await parseExcelUpload(filePath, {
      originalName,
      uploadId,
      metadata: opts.metadata ?? {},
    })

    await db("upload_jobs").where({ id: uploadId }).update({
      status: "COMPLETED",
      processed_rows: result.processedRows,
      failed_rows: result.failedRows,
      row_count: result.processedRows + result.failedRows,
      error_summary: result.failedRows ? JSON.stringify(result.errors) : null,
      period_start: result.period?.start ?? null,
      period_end: result.period?.end ?? null,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    uploadEvents.emitCompleted(uploadId, result)
    await notifySubscribers({ event: "upload_completed", uploadId, summary: result })
    flushCache()

    // cleanup uploaded file once processed
    try {
      if (filePath.startsWith(config.uploadsDir)) {
        fs.unlinkSync(filePath)
      }
    } catch {
      // ignore
    }

    return { uploadId, summary: result }
  } catch (error: any) {
    await db("upload_jobs").where({ id: uploadId }).update({
      status: "FAILED",
      error_summary: error?.message ?? "upload_failed",
      updated_at: new Date().toISOString(),
    })
    const payload = { event: "upload_failed", uploadId, error: error?.message, details: error?.details }
    uploadEvents.emitFailed(uploadId, error?.message ?? "upload_failed")
    await notifySubscribers(payload)
    throw error
  }
}

