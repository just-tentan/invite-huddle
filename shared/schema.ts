import { pgTable, text, uuid, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// For authentication - simplified user table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Host profiles
export const hosts = pgTable("hosts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  name: text("name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  preferredName: text("preferred_name"),
  contact: text("contact"),
  pictureUrl: text("picture_url"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  linkedinUrl: text("linkedin_url"),
  websiteUrl: text("website_url"),
  personalStatement: text("personal_statement"),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: uuid("host_id").notNull().references(() => hosts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dateTime: timestamp("date_time").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Invitations table
export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  name: text("name"),
  rsvpStatus: text("rsvp_status", { enum: ["pending", "yes", "no", "maybe"] }).default("pending"),
  isBlocked: boolean("is_blocked").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Event messages table for chat
export const eventMessages = pgTable("event_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  senderType: text("sender_type", { enum: ["host", "guest"] }).notNull(),
  senderId: uuid("sender_id"), // host_id for hosts, invitation_id for guests
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schema validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  location: true,
}).extend({
  dateTime: z.string().transform((str) => new Date(str)),
});

export const insertInvitationSchema = createInsertSchema(invitations).pick({
  eventId: true,
  email: true,
  phone: true,
  name: true,
});

export const insertEventMessageSchema = createInsertSchema(eventMessages).pick({
  eventId: true,
  senderType: true,
  senderId: true,
  message: true,
});

export const updateHostProfileSchema = createInsertSchema(hosts).pick({
  firstName: true,
  lastName: true,
  preferredName: true,
  contact: true,
  pictureUrl: true,
  facebookUrl: true,
  instagramUrl: true,
  twitterUrl: true,
  linkedinUrl: true,
  websiteUrl: true,
  personalStatement: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateHostProfile = z.infer<typeof updateHostProfileSchema>;
export type User = typeof users.$inferSelect;
export type Host = typeof hosts.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type EventMessage = typeof eventMessages.$inferSelect;
