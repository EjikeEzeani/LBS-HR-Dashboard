const fs = require("fs")
const path = require("path")

exports.up = async function up(knex) {
  const sqlPath = path.join(__dirname, "001_schema.sql")
  const sql = fs.readFileSync(sqlPath, "utf-8")
  const statements = sql
    .split(/;\s*\n/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length)

  for (const statement of statements) {
    await knex.raw(`${statement};`)
  }
}

exports.down = async function down(knex) {
  await knex.schema
    .dropTableIfExists("upload_errors")
    .dropTableIfExists("cost_per_hire")
    .dropTableIfExists("engagement_metrics")
    .dropTableIfExists("statutory_compliance")
    .dropTableIfExists("vacancies")
    .dropTableIfExists("exit_records")
    .dropTableIfExists("onboarding_records")
    .dropTableIfExists("sickbay_records")
    .dropTableIfExists("training_records")
    .dropTableIfExists("leave_records")
    .dropTableIfExists("employees")
    .dropTableIfExists("departments")
    .dropTableIfExists("upload_jobs")
}

