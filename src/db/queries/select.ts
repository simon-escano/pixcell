import db from "@/db"
import { patient } from "@/db/schema"

export async function getPatients() {
  return await db.select().from(patient)
}
