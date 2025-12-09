import { Knex } from "knex"
import dotenv from "dotenv"

dotenv.config()

const client = process.env.DATABASE_CLIENT ?? "sqlite3"
const connection = process.env.DATABASE_URL ?? "file:./data/hr.db"

const config: Record<string, Knex.Config> = {
  sqlite3: {
    client: "sqlite3",
    connection: { filename: connection.replace("file:", "") },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn: any, done: any) => {
        conn.run("PRAGMA foreign_keys = ON", done)
      },
    },
    migrations: { directory: "./migrations" },
  },
  pg: {
    client: "pg",
    connection,
    pool: { min: 2, max: 10 },
    migrations: { directory: "./migrations" },
  },
}

export default config[client]

