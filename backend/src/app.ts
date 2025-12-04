import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"

import uploadsRouter from "./routes/uploads"
import kpisRouter from "./routes/kpis"
import leaveRouter from "./routes/leave"
import exportsRouter from "./routes/exports"
import employeesRouter from "./routes/employees"
import adminRouter from "./routes/admin"
import webhookRouter from "./routes/webhook"
import { requireApiKey } from "./middleware/auth"
import { uploadRateLimiter } from "./middleware/rateLimit"

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: "*",
  }),
)
app.use(express.json({ limit: "10mb" }))
app.use(morgan("dev"))

app.get("/health", (_req, res) => {
  res.json({ status: "ok" })
})

app.use("/api/uploads", requireApiKey, uploadRateLimiter, uploadsRouter)
app.use("/api/admin", requireApiKey, adminRouter)
app.use("/api/dashboards", kpisRouter)
app.use("/api/leave", leaveRouter)
app.use("/api/exports", exportsRouter)
app.use("/api/employees", employeesRouter)
app.use("/api/webhook", webhookRouter)

export default app

