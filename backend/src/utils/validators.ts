import { z } from "zod"

export const uploadMetadataSchema = z.object({
  uploader: z.string().min(1),
  upload_date: z.string(),
  reporting_period_start: z.string(),
  reporting_period_end: z.string(),
  source_file_name: z.string(),
})

