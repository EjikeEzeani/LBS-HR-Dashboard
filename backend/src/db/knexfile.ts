import path from "path"
import { Knex } from "knex"
import dotenv from "dotenv"

dotenv.config()

const projectRoot = path.resolve(__dirname, "../..")
const migrationsDir = path.join(projectRoot, "migrations")

const client = process.env.DATABASE_CLIENT ?? "sqlite3"
const databaseUrl = process.env.DATABASE_URL ?? "file:./data/hr.db"

const resolveSqliteFilename = (url: string) => {
  const filename = url.replace("file:", "")
  return path.isAbsolute(filename) ? filename : path.join(projectRoot, filename)
}

const config: Record<string, Knex.Config> = {
  sqlite3: {
    client: "sqlite3",
    connection: { filename: resolveSqliteFilename(databaseUrl) },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn: any, done: any) => {
        conn.run("PRAGMA foreign_keys = ON", done)
      },
    },
    migrations: { directory: migrationsDir },
  },
  pg: {
    client: "pg",
    connection: databaseUrl,
    pool: { min: 2, max: 10 },
    migrations: { directory: migrationsDir },
  },
}

export default config[client]

