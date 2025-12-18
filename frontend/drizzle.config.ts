import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: '.env.local' });

// For Supabase: Use direct connection (port 5432) instead of pooler (port 6543)
// drizzle-kit has issues with connection poolers during introspection
// If your DATABASE_URL uses port 6543 or has ?pgbouncer=true, switch to direct connection
const databaseUrl = process.env.DATABASE_URL!;

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  // Only manage the 'public' schema - Supabase manages the 'auth' schema
  schemaFilter: ["public"],
  dialect: 'postgresql',
  verbose: true,
  strict: true,
  dbCredentials: {
    url: databaseUrl,
  },
});
