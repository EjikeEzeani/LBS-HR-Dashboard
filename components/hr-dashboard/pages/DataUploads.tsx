"use client"

import { useState } from "react"
import { uploadExcelFile, type UploadSheetSummary } from "@/lib/upload-client"
import { Upload } from "lucide-react"

interface DataUploadsProps {
  month: string
}

export default function DataUploads(_props: DataUploadsProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [summary, setSummary] = useState<UploadSheetSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setSummary(null)
    setError(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select an Excel file first.")
      return
    }
    setUploading(true)
    setError(null)
    try {
      const result = await uploadExcelFile(selectedFile)
      setSummary(result.summary?.sheets ?? [])
    } catch (err: any) {
      setError(err?.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl shadow-lg">
          <Upload className="text-white" size={22} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Data Uploads</h1>
          <p className="text-slate-600">Upload Excel templates to refresh dashboard data continuously.</p>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-indigo-100 shadow-md space-y-4">
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-slate-700">Excel file (.xlsx)</label>
          <input type="file" accept=".xlsx" onChange={onFileChange} className="block w-full text-sm" />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="self-start px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow hover:bg-indigo-700 disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload & Process"}
          </button>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-slate-700">
          <p className="font-semibold mb-2">Template requirements:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Worksheet names: <span className="font-semibold">Employees</span>, <span className="font-semibold">Leave</span>, <span className="font-semibold">Engagement</span>.</li>
            <li>Include headers in the first row; required: <span className="font-semibold">employee_number</span> for Employees/Leave.</li>
            <li>Dates as YYYY-MM-DD; columns for leave: leave_type, start_date, end_date, working_days, status, reason.</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-semibold">{error}</div>
      )}

      {summary && (
        <div className="glass p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-lg font-bold text-slate-900">Upload summary</h3>
          <div className="space-y-3">
            {summary?.map((item) => (
              <div
                key={item.sheet}
                className="flex items-start justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.sheet}</p>
                  <p className="text-xs text-slate-500">
                    Processed: {item.processed_rows} • Failed: {item.failed_rows}
                  </p>
                </div>
                {item.errors && item.errors.length > 0 && (
                  <div className="text-xs text-red-600 max-w-md">
                    {item.errors.slice(0, 3).map((err, idx) => (
                      <div key={idx}>
                        Row {err.row} / {err.column}: {err.message}
                      </div>
                    ))}
                    {item.errors.length > 3 && <div>+{item.errors.length - 3} more…</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">New data will feed the dashboards after backend aggregation.</p>
        </div>
      )}
    </div>
  )
}

