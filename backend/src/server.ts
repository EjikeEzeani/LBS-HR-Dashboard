import "dotenv/config"
import app from "./app"
import { db } from "./db"

const PORT = Number(process.env.PORT) || 4000

async function start() {
  try {
    await db.raw("select 1+1 as result")
    console.log("Database connection established")
  } catch (err) {
    console.error("Database connection failed", err)
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
  })
}

start()

