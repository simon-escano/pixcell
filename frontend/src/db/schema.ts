import { not } from "drizzle-orm";
import { pgTable, uuid, text, json, jsonb, timestamp, boolean, varchar, date, pgSchema, integer, pgEnum } from "drizzle-orm/pg-core";

const authSchema = pgSchema('auth');

export const reportStatusEnum = pgEnum("report_status", [
  "Draft",
  "Finalized",
  "UNDER_REVIEW",
  "REJECTED",
  "ARCHIVED",
]);


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
  imageId: uuid("image_id").references(() => image.id),
  licenseNo: text("license_no")
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
  createdBy: uuid("created_by").references(() => profile.id),
});


export const sampleImage = pgTable("sample_image",{
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

export const report = pgTable("report", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  isAiGenerated: boolean("is_ai_generated").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  exportedUrl: text("exported_url"),
  content: jsonb("content").notNull(),
  exportFormat: varchar("export_format", { length: 255 }),
  sampleId: uuid("sample_id").notNull().references(() => sample.id, { onDelete: "cascade" }),
  generatedBy: uuid("generated_by").notNull().references(() => user.id),
  title: text("title"),
  patientId: uuid("patient_id").references(() => patient.id, { onUpdate: "cascade", onDelete: "cascade" }),
  testType: text("test_type"),
  status: reportStatusEnum("status"),
  code: text('code'),
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


export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => user.id),
  // Section 1: Overall Experience
  overallExperience: integer("overall_experience"),
  interfaceUsability: integer("interface_usability"),
  // Section 2: AI Assistance & Accuracy
  aiAccuracy: integer("ai_accuracy"),
  aiUsability: integer("ai_usability"),
  // Section 3: Collaboration Features
  collaborationTools: integer("collaboration_tools"),
  collaborationIssues: integer("collaboration_issues"),
  // Section 4: Suggestions and Issues
  featureSuggestions: text("feature_suggestions"),
  technicalIssues: text("technical_issues"),
  // Section 5: Final Thoughts
  recommendation: integer("recommendation"),
  additionalComments: text("additional_comments"),
  // Metadata
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const doctorPatient = pgTable("doctor_patient", {
  id: uuid("id").primaryKey().defaultRandom(),
  doctorId: uuid("doctor_id").notNull().references(() => profile.id),
  patientId: uuid("patient_id").notNull().references(() => patient.id),
  orderNo: integer("order_no"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Role = typeof role.$inferSelect;
export type Profile = typeof profile.$inferSelect;
export type Patient = typeof patient.$inferSelect;
export type Sample = typeof sample.$inferSelect;
export type SampleImage = typeof sampleImage.$inferSelect;
export type AiAnalysis = typeof aiAnalysis.$inferSelect;
export type Report = typeof report.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Image = typeof image.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;

// Combined type for sample with image data
export type SampleWithImage = Sample & {
  uploadedBy: string | null;
  metadata: any | null;
  capturedAt: Date | null;
  imageId: string | null;
  imageUrl: string | null;
};

// Type for patient data returned by getPatientById (includes imageUrl but not noteId)
export type PatientWithImage = Omit<Patient, 'noteId'> & {
  imageUrl: string | null;
};

// Type for profile data returned by getProfileByUserId (includes imageUrl)
export type ProfileWithImage = Profile & {
  imageUrl: string | null;
};

