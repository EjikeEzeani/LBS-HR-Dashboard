import "dotenv/config"
import path from "path"
import fs from "fs"
import { handleExcelUpload } from "../services/uploadService"

async function seedFromFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fixture not found: ${filePath}`)
  }
  const fileName = path.basename(filePath)
  console.log(`Seeding ${fileName}...`)
  await handleExcelUpload(filePath, fileName, { uploader: "Seeder" })
  console.log(`✓ ${fileName} loaded`)
}

async function main() {
  const base = path.join(process.cwd(), "tests/fixtures")
  const files = ["HR_Report_Aug_2025.xlsx", "HR_Report_Sept_2025.xlsx"]
  for (const file of files) {
    await seedFromFile(path.join(base, file))
  }
  console.log("Seed complete")
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

