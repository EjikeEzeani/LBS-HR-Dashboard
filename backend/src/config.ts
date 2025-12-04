import fs from "fs"
import path from "path"
import dotenv from "dotenv"

dotenv.config()

const HOLIDAYS_FILE = process.env.HOLIDAYS_FILE ?? path.join(process.cwd(), "config/holidays.json")

let holidays: string[] = []
if (fs.existsSync(HOLIDAYS_FILE)) {
  try {
    const raw = fs.readFileSync(HOLIDAYS_FILE, "utf-8")
    holidays = JSON.parse(raw)
  } catch (err) {
    console.warn("Failed to parse holidays file", err)
  }
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV ?? "development",
  apiKey: process.env.API_KEY ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  uploadsDir: process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads"),
  holidays,
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? 300),
}

