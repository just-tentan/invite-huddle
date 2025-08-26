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

// Event groups table
export const eventGroups = pgTable("event_groups", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: uuid("host_id").notNull().references(() => hosts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Event groups guest lists relationship table
export const eventGroupGuestLists = pgTable("event_group_guest_lists", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventGroupId: uuid("event_group_id").notNull().references(() => eventGroups.id, { onDelete: "cascade" }),
  guestListId: uuid("guest_list_id").notNull().references(() => guestLists.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Guest lists table
export const guestLists = pgTable("guest_lists", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: uuid("host_id").notNull().references(() => hosts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Guest list members table
export const guestListMembers = pgTable("guest_list_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  guestListId: uuid("guest_list_id").notNull().references(() => guestLists.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: uuid("host_id").notNull().references(() => hosts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startDateTime: timestamp("start_date_time").notNull(),
  endDateTime: timestamp("end_date_time"),
  isAllDay: boolean("is_all_day").default(false),
  location: text("location"),
  exactAddress: text("exact_address"),
  customDirections: text("custom_directions"),
  status: text("status", { enum: ["upcoming", "cancelled", "past"] }).default("upcoming"),
  groupId: uuid("group_id").references(() => eventGroups.id),
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
  isSuspended: boolean("is_suspended").default(false),
  messageBlocked: boolean("message_blocked").default(false),
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
  exactAddress: true,
  customDirections: true,
  isAllDay: true,
  groupId: true,
}).extend({
  startDateTime: z.string().transform((str) => new Date(str)),
  endDateTime: z.string().optional().transform((str) => str ? new Date(str) : undefined),
});

export const updateEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  location: true,
  exactAddress: true,
  customDirections: true,
  startDateTime: true,
  endDateTime: true,
  isAllDay: true,
  status: true,
  groupId: true,
});

export const insertEventGroupSchema = createInsertSchema(eventGroups).pick({
  title: true,
  description: true,
});

export const insertEventGroupGuestListSchema = createInsertSchema(eventGroupGuestLists).pick({
  eventGroupId: true,
  guestListId: true,
});

export const insertGuestListSchema = createInsertSchema(guestLists).pick({
  name: true,
  description: true,
});

export const insertGuestListMemberSchema = createInsertSchema(guestListMembers).pick({
  guestListId: true,
  name: true,
  email: true,
  phone: true,
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
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;
export type InsertEventGroup = z.infer<typeof insertEventGroupSchema>;
export type InsertEventGroupGuestList = z.infer<typeof insertEventGroupGuestListSchema>;
export type InsertGuestList = z.infer<typeof insertGuestListSchema>;
export type InsertGuestListMember = z.infer<typeof insertGuestListMemberSchema>;
export type UpdateHostProfile = z.infer<typeof updateHostProfileSchema>;

export type User = typeof users.$inferSelect;
export type Host = typeof hosts.$inferSelect;
export type Event = typeof events.$inferSelect;
export type EventGroup = typeof eventGroups.$inferSelect;
export type EventGroupGuestList = typeof eventGroupGuestLists.$inferSelect;
export type GuestList = typeof guestLists.$inferSelect;
export type GuestListMember = typeof guestListMembers.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type EventMessage = typeof eventMessages.$inferSelect;
