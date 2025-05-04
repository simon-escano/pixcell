import 'dotenv/config'

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!

declare global {
  var postgresClient: ReturnType<typeof postgres> | undefined
  var drizzleDb: ReturnType<typeof drizzle> | undefined
}

const client =
  globalThis.postgresClient ?? postgres(connectionString, { prepare: false })
if (process.env.NODE_ENV !== 'production') globalThis.postgresClient = client

const db =
  globalThis.drizzleDb ?? drizzle(client)
if (process.env.NODE_ENV !== 'production') globalThis.drizzleDb = db

export { client, db }
