import { not } from "drizzle-orm";
import { pgTable, uuid, text, json, jsonb, timestamp, boolean, varchar, date, pgSchema, integer } from "drizzle-orm/pg-core";

const authSchema = pgSchema('auth');

export const user = authSchema.table('users', {
	id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  phone: varchar("phone"),
});

export const role = pgTable("role", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
});

export const profile = pgTable("profile", {
  id: uuid("id").primaryKey(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  userId: uuid('user_id').references(() => user.id).notNull(),
  roleId: uuid("role_id").notNull().references(() => role.id),
  imageId: uuid("image_id").references(() => image.id)
});

export const image = pgTable("image", {
  id: uuid("id").primaryKey(),
  imageUrl: text("image_url")
});

export const patient = pgTable("patient", {
  id: uuid("id").primaryKey().defaultRandom(),
  birthDate: date("birth_date").notNull(),
  sex: text("sex").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  contactNumber: varchar("contact_number").notNull(),
  email: varchar("email").notNull(),
  address: text("address").notNull(),
  height: integer("height").notNull(),
  weight: integer("weight").notNull(),
  bloodType: varchar("blood_type", { length: 3 }).notNull(),
  imageId: uuid("image_id").references(() => image.id).unique(),
  noteId: uuid("note_id").references(() => note.id).unique()
});

export const note = pgTable("note",{
  id: uuid("id").primaryKey(),
  note_content: text("note_content")
});


export const sample_image = pgTable("sample_image",{
  id: uuid("id").primaryKey().defaultRandom(),
  sampleId: uuid("sample_id").references(() => sample.id),
  uploadedBy: uuid("profile_id").references(() => profile.id),
  metadata: json("metadata").notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow(),
  imageId: uuid("image_id").references(() => image.id).unique(),

});



export const sample = pgTable("sample", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patient.id),
  sampleName: text("sample_name"),
  createdBy: uuid("created_by").notNull().references(()=>user.id)
});


export const aiAnalysis = pgTable("ai_analysis", {
  id: uuid("id").primaryKey().defaultRandom(),
  sampleId: uuid("sample_id").notNull().references(() => sample.id, { onDelete: 'cascade' }),
  generatedBy: uuid("generated_by").notNull().references(() => profile.id),
  findings: json("findings"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const annotation = pgTable("annotation", {
  id: uuid("id").primaryKey().defaultRandom(),
  sample_image_id: uuid("sample_image_id").notNull().references(() => sample_image.id, { onDelete: 'cascade' }),
  profileId: uuid("profile_id").notNull().references(() => profile.id),
  content: jsonb("content").notNull(),
  drawingData: jsonb("drawing_data").notNull(),
  coordinates: jsonb("coordinates").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const report = pgTable("report", {
  id: uuid("id").primaryKey().defaultRandom(),
  isAiGenerated: boolean("is_ai_generated").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  exportedUrl: text("exported_url"),
  content: text("content").notNull(),
  exportFormat: varchar("export_format"),
  sampleId: uuid("sample_id").notNull().references(() => sample.id, { onDelete: 'cascade' }),
  generatedBy: uuid("generated_by").notNull().references(() => user.id),
});

export const session = pgTable("session", {
  sessionId: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("user_id").notNull().references(() => profile.id),
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
export type Image = typeof image.$inferSelect;
export type Note = typeof note.$inferSelect;