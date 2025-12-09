"use client"

export type UploadSheetSummary = {
  sheet: string
  processed_rows: number
  failed_rows: number
  errors?: Array<{ row: number; column: string; message: string }>
}

export type UploadResponse = {
  uploadId: string
  summary: {
    file: string
    sheets: UploadSheetSummary[]
  }
  error?: string
}

const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000"

export async function uploadExcelFile(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${apiBase}/api/uploads/excel`, {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const message = await res.text()
    throw new Error(message || `Upload failed with status ${res.status}`)
  }

  return res.json()
}

