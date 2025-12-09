import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"

import uploadsRouter from "./routes/uploads"
import kpisRouter from "./routes/kpis"
import leaveRouter from "./routes/leave"

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

app.use("/api/uploads", uploadsRouter)
app.use("/api/dashboards", kpisRouter)
app.use("/api/leave", leaveRouter)

export default app

