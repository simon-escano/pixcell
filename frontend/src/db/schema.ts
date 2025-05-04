import { pgTable, uuid, text, json, jsonb, timestamp, boolean, varchar, date, pgSchema, integer } from "drizzle-orm/pg-core";

const authSchema = pgSchema('auth');

export const user = authSchema.table('users', {
	id: uuid('id').primaryKey(),
});

export const role = pgTable("role", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
});

export const profile = pgTable("profile", {
  id: uuid("id").primaryKey(),
  userId: uuid('user_id').references(() => user.id).notNull(),
  roleId: uuid("role_id").notNull().references(() => role.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  imageUrl: text("image_url")
});

export const patient = pgTable("patient", {
  id: uuid("id").primaryKey().defaultRandom(),
  birthDate: date("birth_date").notNull(),
  sex: text("sex").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  contactNumber: varchar("contact_number").notNull(),
  email: varchar("email").notNull(),
  address: text("address").notNull(),
  height: integer("height").notNull(),
  weight: integer("weight").notNull(),
  bloodType: varchar("blood_type", { length: 3 }).notNull(),
  imageUrl: text("image_url")
});


export const sample = pgTable("sample", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patient.id),
  uploadedBy: uuid("uploaded_by").notNull().references(() => user.id),
  metadata: json("metadata").notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow(),
  imageUrl: text("image_url").notNull(),
});

export const aiAnalysis = pgTable("ai_analysis", {
  id: uuid("id").primaryKey().defaultRandom(),
  sampleId: uuid("sample_id").notNull().references(() => sample.id),
  generatedBy: uuid("generated_by").notNull().references(() => user.id),
  findings: json("findings"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const annotation = pgTable("annotation", {
  annotationId: uuid("id").primaryKey().defaultRandom(),
  sampleId: uuid("sample_id").notNull().references(() => sample.id),
  userId: uuid("user_id").notNull().references(() => user.id),
  content: jsonb("content").notNull(),
  drawingData: jsonb("drawing_data").notNull(),
  coordinates: jsonb("coordinates").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const report = pgTable("report", {
  id: uuid("id").primaryKey().defaultRandom(),
  sampleId: uuid("sample_id").notNull().references(() => sample.id),
  generatedBy: uuid("generated_by").notNull().references(() => user.id),
  isAiGenerated: boolean("is_ai_generated").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  exportedUrl: text("exported_url"),
  content: text("content").notNull(),
  exportFormat: varchar("export_format"),
});

export const session = pgTable("session", {
  sessionId: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => user.id),
  loginTime: timestamp("login_time", { withTimezone: true }),
  logoutTime: timestamp("logout_time", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export type Role = typeof role.$inferSelect;
export type Profile = typeof profile.$inferSelect;
export type Patient = typeof patient.$inferSelect;
export type Sample = typeof sample.$inferSelect;
export type AiAnalysis = typeof aiAnalysis.$inferSelect;
export type Annotation = typeof annotation.$inferSelect;
export type Report = typeof report.$inferSelect;
export type Session = typeof session.$inferSelect;