import {
  date,
  integer,
  json,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const image = pgTable("image", {
  id: uuid("id").primaryKey().defaultRandom(),
  imageUrl: text("image_url"),
});

export const role = pgTable("role", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
});

const authSchema = pgSchema("auth");

export const user = authSchema.table("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  phone: varchar("phone"),
});

export const profile = pgTable("profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  userId: uuid("user_id")
    .references(() => user.id)
    .notNull(),
  roleId: uuid("role_id")
    .references(() => role.id)
    .notNull(),
  imageId: uuid("image_id").references(() => image.id),
});

export const note = pgTable("note", {
  id: uuid("id").primaryKey(),
  noteContent: text("note_content"),
});

export const patient = pgTable("patient", {
  id: uuid("id").primaryKey().defaultRandom(),
  birthDate: date("birth_date").notNull(),
  sex: text("sex").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  contactNumber: varchar("contact_number").notNull(),
  email: varchar("email").notNull(),
  address: text("address").notNull(),
  height: integer("height").notNull(),
  weight: integer("weight").notNull(),
  bloodType: varchar("blood_type", { length: 3 }).notNull(),
  imageId: uuid("image_id")
    .references(() => image.id)
    .unique(),
  noteId: uuid("note_id")
    .references(() => note.id)
    .unique(),
  createdBy: uuid("created_by").references(() => profile.id),
});

export const sample = pgTable("sample", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .references(() => patient.id)
    .notNull(),
  sampleName: text("sample_name"),
  createdBy: uuid("created_by")
    .references(() => user.id)
    .notNull(),
});

export const sampleImage = pgTable("sample_image", {
  id: uuid("id").primaryKey().defaultRandom(),
  sampleId: uuid("sample_id").references(() => sample.id),
  uploadedBy: uuid("profile_id").references(() => profile.id),
  metadata: json("metadata").notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow(),
  imageId: uuid("image_id")
    .references(() => image.id)
    .unique(),
});

export type Role = typeof role.$inferSelect;
export type Image = typeof image.$inferSelect;
export type Profile = typeof profile.$inferSelect;
export type Patient = typeof patient.$inferSelect;
export type SampleImage = typeof sampleImage.$inferSelect;
export type Sample = typeof sample.$inferSelect;
