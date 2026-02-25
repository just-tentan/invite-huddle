var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/vercel-entry.ts
import express from "express";

// server/routes.ts
import { createServer } from "http";
import session from "express-session";
import pgSession from "connect-pg-simple";
import pg from "pg";

// server/storage.ts
import { eq, and } from "drizzle-orm";

// server/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  announcements: () => announcements,
  eventCollaborators: () => eventCollaborators,
  eventGroupGuestLists: () => eventGroupGuestLists,
  eventGroups: () => eventGroups,
  eventMessages: () => eventMessages,
  events: () => events,
  guestListMembers: () => guestListMembers,
  guestLists: () => guestLists,
  hosts: () => hosts,
  insertAnnouncementSchema: () => insertAnnouncementSchema,
  insertEventCollaboratorSchema: () => insertEventCollaboratorSchema,
  insertEventGroupGuestListSchema: () => insertEventGroupGuestListSchema,
  insertEventGroupSchema: () => insertEventGroupSchema,
  insertEventMessageSchema: () => insertEventMessageSchema,
  insertEventSchema: () => insertEventSchema,
  insertGuestListMemberSchema: () => insertGuestListMemberSchema,
  insertGuestListSchema: () => insertGuestListSchema,
  insertInvitationSchema: () => insertInvitationSchema,
  insertPollSchema: () => insertPollSchema,
  insertPollVoteSchema: () => insertPollVoteSchema,
  insertUserSchema: () => insertUserSchema,
  invitations: () => invitations,
  pollVotes: () => pollVotes,
  polls: () => polls,
  updateEventCollaboratorSchema: () => updateEventCollaboratorSchema,
  updateEventSchema: () => updateEventSchema,
  updateHostProfileSchema: () => updateHostProfileSchema,
  updatePollSchema: () => updatePollSchema,
  users: () => users
});
import { pgTable, text, uuid, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
var users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var hosts = pgTable("hosts", {
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
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var eventGroups = pgTable("event_groups", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: uuid("host_id").notNull().references(() => hosts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var eventGroupGuestLists = pgTable("event_group_guest_lists", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventGroupId: uuid("event_group_id").notNull().references(() => eventGroups.id, { onDelete: "cascade" }),
  guestListId: uuid("guest_list_id").notNull().references(() => guestLists.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var guestLists = pgTable("guest_lists", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: uuid("host_id").notNull().references(() => hosts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var guestListMembers = pgTable("guest_list_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  guestListId: uuid("guest_list_id").notNull().references(() => guestLists.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var events = pgTable("events", {
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
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var invitations = pgTable("invitations", {
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
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var eventMessages = pgTable("event_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  senderType: text("sender_type", { enum: ["host", "guest"] }).notNull(),
  senderId: uuid("sender_id"),
  // host_id for hosts, invitation_id for guests
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var eventCollaborators = pgTable("event_collaborators", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["co-host", "organizer", "collaborator"] }).notNull().default("collaborator"),
  permissions: text("permissions").array().notNull().default(sql`'{}'::text[]`),
  // ["manage_guests", "manage_groups", "manage_event"]
  invitedBy: uuid("invited_by").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "accepted", "declined"] }).default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: uuid("host_id").notNull().references(() => hosts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  targetAudience: text("target_audience", { enum: ["all_users", "event_attendees", "specific_users"] }).notNull().default("all_users"),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
  // Optional - for event-specific announcements
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var polls = pgTable("polls", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: uuid("host_id").notNull().references(() => hosts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  options: text("options").array().notNull(),
  // Array of poll options
  allowMultipleChoices: boolean("allow_multiple_choices").default(false),
  endDate: timestamp("end_date").notNull(),
  status: text("status", { enum: ["active", "ended", "converted"] }).default("active"),
  convertedEventId: uuid("converted_event_id").references(() => events.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var pollVotes = pgTable("poll_votes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: uuid("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  voterEmail: text("voter_email"),
  // For non-registered users
  voterName: text("voter_name"),
  // For non-registered users
  selectedOptions: text("selected_options").array().notNull(),
  // Array of selected option indices
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true
});
var insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  location: true,
  exactAddress: true,
  customDirections: true,
  isAllDay: true,
  groupId: true
}).extend({
  startDateTime: z.string().transform((str) => new Date(str)),
  endDateTime: z.string().optional().transform((str) => str ? new Date(str) : void 0)
});
var updateEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  location: true,
  exactAddress: true,
  customDirections: true,
  startDateTime: true,
  endDateTime: true,
  isAllDay: true,
  status: true,
  groupId: true
});
var insertEventGroupSchema = createInsertSchema(eventGroups).pick({
  title: true,
  description: true
});
var insertEventGroupGuestListSchema = createInsertSchema(eventGroupGuestLists).pick({
  eventGroupId: true,
  guestListId: true
});
var insertGuestListSchema = createInsertSchema(guestLists).pick({
  name: true,
  description: true
});
var insertGuestListMemberSchema = createInsertSchema(guestListMembers).pick({
  guestListId: true,
  name: true,
  email: true,
  phone: true
});
var insertInvitationSchema = createInsertSchema(invitations).pick({
  eventId: true,
  email: true,
  phone: true,
  name: true
});
var insertEventMessageSchema = createInsertSchema(eventMessages).pick({
  eventId: true,
  senderType: true,
  senderId: true,
  message: true
});
var insertEventCollaboratorSchema = createInsertSchema(eventCollaborators).pick({
  eventId: true,
  userId: true,
  role: true,
  permissions: true
});
var updateEventCollaboratorSchema = createInsertSchema(eventCollaborators).pick({
  role: true,
  permissions: true,
  status: true
});
var insertAnnouncementSchema = createInsertSchema(announcements).pick({
  title: true,
  content: true,
  targetAudience: true,
  eventId: true
});
var insertPollSchema = createInsertSchema(polls).pick({
  title: true,
  description: true,
  options: true,
  allowMultipleChoices: true
}).extend({
  endDate: z.string().transform((str) => new Date(str))
});
var updatePollSchema = createInsertSchema(polls).pick({
  title: true,
  description: true,
  options: true,
  allowMultipleChoices: true,
  endDate: true
}).partial().extend({
  endDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return void 0;
    return typeof val === "string" ? new Date(val) : val;
  })
});
var insertPollVoteSchema = createInsertSchema(pollVotes).pick({
  pollId: true,
  userId: true,
  voterEmail: true,
  voterName: true,
  selectedOptions: true
});
var updateHostProfileSchema = createInsertSchema(hosts).pick({
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
  personalStatement: true
});

// server/db.ts
var connectionString = process.env.DATABASE_URL;
var needsSsl = !connectionString.includes("sslmode=disable");
var client = postgres(connectionString, {
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});
var db = drizzle(client, { schema: schema_exports });

// server/storage.ts
import bcrypt from "bcryptjs";
import crypto from "crypto";
var DatabaseStorage = class {
  async getUserById(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  async createUser(user) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await db.insert(users).values({
      email: user.email,
      password: hashedPassword
    }).returning();
    if (!result[0]) {
      throw new Error("User creation failed");
    }
    await this.createHost(result[0].id, user.email);
    return result[0];
  }
  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
  async getHostByUserId(userId) {
    const result = await db.select().from(hosts).where(eq(hosts.userId, userId)).limit(1);
    return result[0];
  }
  async createHost(userId, email, name) {
    const result = await db.insert(hosts).values({
      userId,
      email,
      name
    }).returning();
    return result[0];
  }
  async updateHostProfile(userId, profile) {
    const result = await db.update(hosts).set({
      ...profile,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(hosts.userId, userId)).returning();
    return result[0];
  }
  async getEventsByHostId(hostId) {
    return db.select().from(events).where(eq(events.hostId, hostId)).orderBy(events.startDateTime);
  }
  async getEventById(id) {
    const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
    return result[0];
  }
  async createEvent(hostId, title, description, startDateTime, endDateTime, location, exactAddress, customDirections, isAllDay, groupId) {
    const result = await db.insert(events).values({
      hostId,
      title,
      description,
      startDateTime,
      endDateTime,
      location,
      exactAddress,
      customDirections,
      isAllDay,
      groupId
    }).returning();
    return result[0];
  }
  async updateEvent(id, updates) {
    const result = await db.update(events).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(events.id, id)).returning();
    return result[0];
  }
  async createInvitation(eventId, email, phone, name) {
    const token = crypto.randomBytes(32).toString("base64url");
    const result = await db.insert(invitations).values({
      eventId,
      token,
      email,
      phone,
      name
    }).returning();
    return result[0];
  }
  async getInvitationById(id) {
    const result = await db.select().from(invitations).where(eq(invitations.id, id)).limit(1);
    return result[0];
  }
  async getInvitationByToken(token) {
    const result = await db.select().from(invitations).where(eq(invitations.token, token)).limit(1);
    return result[0];
  }
  async getInvitationsByEventId(eventId) {
    return db.select().from(invitations).where(eq(invitations.eventId, eventId));
  }
  async updateInvitationRSVP(token, rsvpStatus) {
    await db.update(invitations).set({ rsvpStatus }).where(eq(invitations.token, token));
  }
  async removeInvitation(id) {
    await db.delete(invitations).where(eq(invitations.id, id));
  }
  async updateInvitationStatus(id, status) {
    await db.update(invitations).set({
      isSuspended: status.suspended,
      messageBlocked: status.blocked,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(invitations.id, id));
  }
  async getEventMessages(eventId) {
    return db.select().from(eventMessages).where(eq(eventMessages.eventId, eventId)).orderBy(eventMessages.createdAt);
  }
  async createEventMessage(eventId, senderType, senderId, message) {
    const result = await db.insert(eventMessages).values({
      eventId,
      senderType,
      senderId,
      message
    }).returning();
    return result[0];
  }
  // Event Group methods
  async getEventGroupsByHostId(hostId) {
    return db.select().from(eventGroups).where(eq(eventGroups.hostId, hostId)).orderBy(eventGroups.createdAt);
  }
  async getEventGroupById(id) {
    const result = await db.select().from(eventGroups).where(eq(eventGroups.id, id)).limit(1);
    return result[0];
  }
  async createEventGroup(hostId, data) {
    const result = await db.insert(eventGroups).values({
      hostId,
      ...data
    }).returning();
    return result[0];
  }
  async updateEventGroup(id, data) {
    const result = await db.update(eventGroups).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(eventGroups.id, id)).returning();
    return result[0];
  }
  async deleteEventGroup(id) {
    await db.delete(eventGroups).where(eq(eventGroups.id, id));
  }
  // Guest List methods
  async getGuestListsByHostId(hostId) {
    return db.select().from(guestLists).where(eq(guestLists.hostId, hostId)).orderBy(guestLists.createdAt);
  }
  async getGuestListById(id) {
    const result = await db.select().from(guestLists).where(eq(guestLists.id, id)).limit(1);
    return result[0];
  }
  async createGuestList(hostId, data) {
    const result = await db.insert(guestLists).values({
      hostId,
      ...data
    }).returning();
    return result[0];
  }
  async updateGuestList(id, data) {
    const result = await db.update(guestLists).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(guestLists.id, id)).returning();
    return result[0];
  }
  async deleteGuestList(id) {
    await db.delete(guestLists).where(eq(guestLists.id, id));
  }
  // Guest List Member methods
  async getGuestListMembers(guestListId) {
    return db.select().from(guestListMembers).where(eq(guestListMembers.guestListId, guestListId)).orderBy(guestListMembers.createdAt);
  }
  async createGuestListMember(data) {
    const result = await db.insert(guestListMembers).values(data).returning();
    return result[0];
  }
  async updateGuestListMember(id, data) {
    const result = await db.update(guestListMembers).set(data).where(eq(guestListMembers.id, id)).returning();
    return result[0];
  }
  async deleteGuestListMember(id) {
    await db.delete(guestListMembers).where(eq(guestListMembers.id, id));
  }
  async deleteEvent(id) {
    await db.delete(events).where(eq(events.id, id));
  }
  // Event Group Guest List methods
  async getEventGroupGuestLists(eventGroupId) {
    return db.select().from(eventGroupGuestLists).where(eq(eventGroupGuestLists.eventGroupId, eventGroupId));
  }
  async addGuestListToEventGroup(eventGroupId, guestListId) {
    const result = await db.insert(eventGroupGuestLists).values({
      eventGroupId,
      guestListId
    }).returning();
    return result[0];
  }
  async removeGuestListFromEventGroup(eventGroupId, guestListId) {
    await db.delete(eventGroupGuestLists).where(
      and(
        eq(eventGroupGuestLists.eventGroupId, eventGroupId),
        eq(eventGroupGuestLists.guestListId, guestListId)
      )
    );
  }
  // Event Collaborator methods
  async getEventCollaborators(eventId) {
    return db.select().from(eventCollaborators).where(eq(eventCollaborators.eventId, eventId)).orderBy(eventCollaborators.createdAt);
  }
  async getEventCollaboratorById(id) {
    const result = await db.select().from(eventCollaborators).where(eq(eventCollaborators.id, id)).limit(1);
    return result[0];
  }
  async createEventCollaborator(eventId, userId, invitedBy, data) {
    const result = await db.insert(eventCollaborators).values({
      eventId,
      userId,
      invitedBy,
      ...data
    }).returning();
    return result[0];
  }
  async updateEventCollaborator(id, data) {
    const result = await db.update(eventCollaborators).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(eventCollaborators.id, id)).returning();
    return result[0];
  }
  async deleteEventCollaborator(id) {
    await db.delete(eventCollaborators).where(eq(eventCollaborators.id, id));
  }
  async getUserCollaboratedEvents(userId) {
    return db.select().from(eventCollaborators).where(and(eq(eventCollaborators.userId, userId), eq(eventCollaborators.status, "accepted"))).orderBy(eventCollaborators.createdAt);
  }
  // Announcement methods
  async getAnnouncementsByHostId(hostId) {
    return db.select().from(announcements).where(eq(announcements.hostId, hostId)).orderBy(announcements.createdAt);
  }
  async getAnnouncementById(id) {
    const result = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
    return result[0];
  }
  async createAnnouncement(hostId, data) {
    const result = await db.insert(announcements).values({
      hostId,
      ...data
    }).returning();
    return result[0];
  }
  async updateAnnouncement(id, data) {
    const result = await db.update(announcements).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(announcements.id, id)).returning();
    return result[0];
  }
  async deleteAnnouncement(id) {
    await db.delete(announcements).where(eq(announcements.id, id));
  }
  async publishAnnouncement(id) {
    const result = await db.update(announcements).set({
      isPublished: true,
      publishedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(announcements.id, id)).returning();
    return result[0];
  }
  // Poll methods
  async getPollsByHostId(hostId) {
    return db.select().from(polls).where(eq(polls.hostId, hostId)).orderBy(polls.createdAt);
  }
  async getActivePollsByHostId(hostId) {
    return db.select().from(polls).where(and(eq(polls.hostId, hostId), eq(polls.status, "active"))).orderBy(polls.createdAt);
  }
  async getPollById(id) {
    const result = await db.select().from(polls).where(eq(polls.id, id)).limit(1);
    return result[0];
  }
  async createPoll(hostId, data) {
    const result = await db.insert(polls).values({
      hostId,
      ...data
    }).returning();
    return result[0];
  }
  async updatePoll(id, data) {
    const result = await db.update(polls).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(polls.id, id)).returning();
    return result[0];
  }
  async deletePoll(id) {
    await db.delete(polls).where(eq(polls.id, id));
  }
  async endPoll(id) {
    const result = await db.update(polls).set({
      status: "ended",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(polls.id, id)).returning();
    return result[0];
  }
  async convertPollToEvent(pollId, eventId) {
    const result = await db.update(polls).set({
      status: "converted",
      convertedEventId: eventId,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(polls.id, pollId)).returning();
    return result[0];
  }
  // Poll Vote methods
  async getPollVotes(pollId) {
    return db.select().from(pollVotes).where(eq(pollVotes.pollId, pollId)).orderBy(pollVotes.createdAt);
  }
  async createPollVote(data) {
    const result = await db.insert(pollVotes).values(data).returning();
    return result[0];
  }
  async getUserPollVote(pollId, userId, voterEmail) {
    let condition;
    if (userId) {
      condition = and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, userId));
    } else if (voterEmail) {
      condition = and(eq(pollVotes.pollId, pollId), eq(pollVotes.voterEmail, voterEmail));
    } else {
      return void 0;
    }
    const result = await db.select().from(pollVotes).where(condition).limit(1);
    return result[0];
  }
  async updatePollVote(id, selectedOptions) {
    const result = await db.update(pollVotes).set({ selectedOptions }).where(eq(pollVotes.id, id)).returning();
    return result[0];
  }
};
var storage = new DatabaseStorage();

// server/email.ts
import { Resend } from "resend";
if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable must be set");
}
var resend = new Resend(process.env.RESEND_API_KEY);
async function sendCancellationEmail({
  to,
  eventTitle,
  eventDate,
  eventLocation,
  hostName,
  guestName
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: `EventHost <onboarding@resend.dev>`,
      to: [to],
      subject: `Event Cancelled: ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626; margin-bottom: 20px;">Event Cancelled</h1>
          ${guestName ? `<p style="color: #374151; margin-bottom: 20px;">Hi ${guestName},</p>` : ""}
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
            <h2 style="margin: 0 0 10px 0; color: #1e293b;">${eventTitle}</h2>
            
            <div style="margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>\u{1F4C5} Was scheduled for:</strong> ${eventDate}</p>
              ${eventLocation ? `<p style="margin: 5px 0;"><strong>\u{1F4CD} Location:</strong> ${eventLocation}</p>` : ""}
              <p style="margin: 5px 0;"><strong>\u{1F464} Host:</strong> ${hostName}</p>
            </div>
          </div>

          <p style="color: #374151; margin: 20px 0;">
            We regret to inform you that this event has been cancelled by the host. 
            ${guestName ? "Thank you for your interest, and we apologize for any inconvenience." : "We apologize for any inconvenience this may cause."}
          </p>

          <p style="color: #6b7280; margin: 20px 0;">
            If you have any questions, please contact the host directly.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Sent by EventHost - Private Event Management Platform
          </p>
        </div>
      `
    });
    if (error) {
      console.error("Resend cancellation email error:", error);
      return false;
    }
    console.log("Cancellation email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Error sending cancellation email:", error);
    return false;
  }
}
async function sendInvitationEmail({
  to,
  eventTitle,
  eventDescription,
  eventDate,
  eventLocation,
  inviteUrl,
  hostEmail,
  guestName,
  hostName,
  token,
  baseUrl
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: `EventHost <onboarding@resend.dev>`,
      to: [to],
      subject: `You're invited to ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">You're Invited!</h1>
          ${guestName ? `<p style="color: #374151; margin-bottom: 20px;">Hi ${guestName},</p>` : ""}
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 10px 0; color: #1e293b;">${eventTitle}</h2>
            ${eventDescription ? `<p style="color: #64748b; margin: 5px 0;">${eventDescription}</p>` : ""}
            
            <div style="margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>\u{1F4C5} When:</strong> ${eventDate}</p>
              ${eventLocation ? `<p style="margin: 5px 0;"><strong>\u{1F4CD} Where:</strong> ${eventLocation}</p>` : ""}
              <p style="margin: 5px 0;"><strong>\u{1F464} Host:</strong> ${hostName ? `${hostName} (${hostEmail})` : hostEmail}</p>
            </div>
          </div>

          <p style="color: #374151; margin: 20px 0;">
            ${guestName ? `${hostName ? hostName : "The event host"} has personally invited you to this private event.` : "You've been personally invited to this private event."} Click the button below to view details and RSVP:
          </p>

          <p style="color: #374151; margin: 20px 0; text-align: center; font-weight: bold;">
            Please respond to this invitation:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <table style="margin: 0 auto; border-spacing: 10px;">
              <tr>
                <td>
                  <a href="${baseUrl}/api/rsvp/${token}/yes" 
                     style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; min-width: 80px; text-align: center;">
                    \u2713 Yes
                  </a>
                </td>
                <td>
                  <a href="${baseUrl}/api/rsvp/${token}/maybe" 
                     style="background-color: #ca8a04; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; min-width: 80px; text-align: center;">
                    ? Maybe
                  </a>
                </td>
                <td>
                  <a href="${baseUrl}/api/rsvp/${token}/no" 
                     style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; min-width: 80px; text-align: center;">
                    \u2717 No
                  </a>
                </td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #2563eb; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 14px;">
              View Full Event Details
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This is a private event invitation. Please don't share this link with others.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Sent by EventHost - Private Event Management Platform
          </p>
        </div>
      `
    });
    if (error) {
      console.error("Resend email error:", error);
      return false;
    }
    console.log("Email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return false;
  }
}
async function sendAnnouncementEmail({
  to,
  title,
  content,
  hostName
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: `EventHost <onboarding@resend.dev>`,
      to: Array.isArray(to) ? to : [to],
      subject: `\u{1F4E2} New Announcement: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">\u{1F4E2} New Announcement</h1>
            ${hostName ? `<p style="margin: 10px 0 0 0;">From: ${hostName}</p>` : ""}
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h2 style="color: #1e293b; margin: 0 0 15px 0;">${title}</h2>
              <p style="color: #374151; line-height: 1.6; white-space: pre-line;">${content}</p>
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
            <p style="text-align: center; margin: 0;">This announcement was sent from EventHost.</p>
          </div>
        </div>
      `
    });
    if (error) {
      console.error("Resend announcement email error:", error);
      return false;
    }
    console.log("Announcement email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Error sending announcement email:", error);
    return false;
  }
}
async function sendPollEmail({
  to,
  title,
  description,
  options,
  endDate,
  hostName,
  pollId,
  baseUrl
}) {
  try {
    console.log("Poll email baseUrl:", baseUrl);
    const formattedDate = endDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    const { data, error } = await resend.emails.send({
      from: `EventHost <onboarding@resend.dev>`,
      to: Array.isArray(to) ? to : [to],
      subject: `\u{1F4CA} New Poll: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">\u{1F4CA} New Poll Available</h1>
            ${hostName ? `<p style="margin: 10px 0 0 0;">From: ${hostName}</p>` : ""}
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h2 style="color: #1e293b; margin: 0 0 15px 0;">${title}</h2>
              ${description ? `<p style="color: #374151; line-height: 1.6; margin-bottom: 20px; white-space: pre-line;">${description}</p>` : ""}
              
              <h3 style="color: #059669; margin: 20px 0 15px 0;">Vote for your preferred option(s):</h3>
              
              <div style="text-align: center; margin: 20px 0;">
                ${options.map(
        (option, index) => `<div style="margin: 10px 0;">
                    <a href="${baseUrl}/api/polls/${pollId}/vote-email?option=${index}" 
                       style="background-color: #059669; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; min-width: 200px; text-align: center; margin: 5px;">
                      ${option}
                    </a>
                  </div>`
      ).join("")}
              </div>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; text-align: center;">
                <strong style="color: #92400e;">\u23F0 Poll ends: ${formattedDate}</strong>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/polls/${pollId}" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  \u{1F4CA} View Full Poll Details
                </a>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
            <p style="text-align: center; margin: 0;">This poll notification was sent from EventHost.</p>
          </div>
        </div>
      `
    });
    if (error) {
      console.error("Resend poll email error:", error);
      return false;
    }
    console.log("Poll email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Error sending poll email:", error);
    return false;
  }
}

// server/objectStorage.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

// server/objectAcl.ts
var ACL_POLICY_METADATA_KEY = "custom:aclPolicy";
function isPermissionAllowed(requested, granted) {
  if (requested === "read" /* READ */) {
    return ["read" /* READ */, "write" /* WRITE */].includes(granted);
  }
  return granted === "write" /* WRITE */;
}
function createObjectAccessGroup(group) {
  switch (group.type) {
    // Implement the case for each type of access group to instantiate.
    //
    // For example:
    // case "USER_LIST":
    //   return new UserListAccessGroup(group.id);
    // case "EMAIL_DOMAIN":
    //   return new EmailDomainAccessGroup(group.id);
    // case "GROUP_MEMBER":
    //   return new GroupMemberAccessGroup(group.id);
    // case "SUBSCRIBER":
    //   return new SubscriberAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}
async function setObjectAclPolicy(objectFile, aclPolicy) {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }
  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy)
    }
  });
}
async function getObjectAclPolicy(objectFile) {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy);
}
async function canAccessObject({
  userId,
  objectFile,
  requestedPermission
}) {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }
  if (aclPolicy.visibility === "public" && requestedPermission === "read" /* READ */) {
    return true;
  }
  if (!userId) {
    return false;
  }
  if (aclPolicy.owner === userId) {
    return true;
  }
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (await accessGroup.hasMember(userId) && isPermissionAllowed(requestedPermission, rule.permission)) {
      return true;
    }
  }
  return false;
}

// server/objectStorage.ts
var REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
var objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  },
  projectId: ""
});
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ObjectStorageService = class {
  constructor() {
  }
  // Gets the public object search paths.
  getPublicObjectSearchPaths() {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr.split(",").map((path) => path.trim()).filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }
  // Gets the private object directory.
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }
  // Search for a public object from the search paths.
  async searchPublicObject(filePath) {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }
  // Downloads an object to the response.
  async downloadObject(file, res, cacheTtlSec = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL() {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
    });
  }
  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath) {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }
  normalizeObjectEntityPath(rawPath) {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }
  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityAclPolicy(rawPath, aclPolicy) {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }
    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }
  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission
  }) {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? "read" /* READ */
    });
  }
};
function parseObjectPath(path) {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

// server/routes.ts
var PostgresSessionStore = pgSession(session);
var formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};
var getBaseUrl = (req) => {
  if (process.env.REPLIT_DOMAINS) return `https://${process.env.REPLIT_DOMAINS}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `${req.protocol}://${req.get("host")}`;
};
async function registerRoutes(app2) {
  app2.set("trust proxy", 1);
  app2.use(session({
    store: new PostgresSessionStore({
      pool: new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 2
      }),
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  }));
  const requireAuth = async (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = user;
    next();
  };
  app2.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password } = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
      const user = await storage.createUser({ email, password });
      req.session.userId = user.id;
      res.json({ user: { id: user.id, email: user.email } });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(error.status || 500).json({ error: error.message || "Signup failed" });
    }
  });
  app2.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = insertUserSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const isValid = await storage.verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      req.session.userId = user.id;
      res.json({ user: { id: user.id, email: user.email } });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.post("/api/auth/signout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Could not sign out" });
      }
      res.json({ success: true });
    });
  });
  app2.get("/api/auth/me", requireAuth, (req, res) => {
    res.json({ user: { id: req.user.id, email: req.user.email } });
  });
  app2.get("/api/events", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const events2 = await storage.getEventsByHostId(host.id);
      const eventsWithCounts = await Promise.all(events2.map(async (event) => {
        const [invitations2, messages] = await Promise.all([
          storage.getInvitationsByEventId(event.id),
          storage.getEventMessages(event.id)
        ]);
        const rsvpCounts = {
          total: invitations2.length,
          yes: invitations2.filter((i) => i.rsvpStatus === "yes").length,
          no: invitations2.filter((i) => i.rsvpStatus === "no").length,
          maybe: invitations2.filter((i) => i.rsvpStatus === "maybe").length,
          pending: invitations2.filter((i) => i.rsvpStatus === "pending").length
        };
        return {
          ...event,
          rsvpCounts,
          messageCount: messages.length
        };
      }));
      res.json(eventsWithCounts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/events", requireAuth, async (req, res) => {
    try {
      const { title, description, startDateTime, endDateTime, location, exactAddress, customDirections, isAllDay, groupId, guests } = req.body;
      const eventData = { title, description, startDateTime, endDateTime, location, exactAddress, customDirections, isAllDay, groupId };
      const parsed = insertEventSchema.parse(eventData);
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const event = await storage.createEvent(
        host.id,
        parsed.title,
        parsed.description || null,
        parsed.startDateTime,
        parsed.endDateTime || null,
        parsed.location || null,
        parsed.exactAddress || null,
        parsed.customDirections || null,
        parsed.isAllDay || false,
        parsed.groupId || null
      );
      const invitations2 = [];
      if (guests && Array.isArray(guests) && guests.length > 0) {
        for (const guest of guests) {
          if (guest.email && guest.email.trim()) {
            const invitation = await storage.createInvitation(event.id, guest.email.trim(), void 0, guest.name || void 0);
            invitations2.push(invitation);
            const baseUrlForLinks = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : `${req.protocol || "http"}://${req.get("host") || "localhost:5000"}`;
            const inviteUrl = `${baseUrlForLinks}/invite/${invitation.token}`;
            const formatDate2 = (dateString) => {
              return new Date(dateString).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });
            };
            try {
              await sendInvitationEmail({
                to: guest.email.trim(),
                eventTitle: parsed.title,
                eventDescription: parsed.description || void 0,
                eventDate: formatDate2(parsed.startDateTime),
                eventLocation: parsed.location || void 0,
                inviteUrl,
                hostEmail: req.user.email,
                guestName: guest.name || void 0,
                hostName: host.preferredName || host.firstName || host.name || void 0,
                token: invitation.token,
                baseUrl: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : `${req.protocol || "http"}://${req.get("host") || "localhost:5000"}`
              });
            } catch (error) {
              console.error(`Failed to send invitation to ${guest.email}:`, error);
            }
          }
        }
      }
      res.json({ event, invitations: invitations2 });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.put("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const updateData = {
        title: req.body.title,
        description: req.body.description,
        startDateTime: new Date(req.body.startDateTime),
        endDateTime: req.body.endDateTime ? new Date(req.body.endDateTime) : null,
        isAllDay: req.body.isAllDay || false,
        location: req.body.location,
        exactAddress: req.body.exactAddress || null,
        customDirections: req.body.customDirections || null,
        groupId: req.body.groupId || null
      };
      const updatedEvent = await storage.updateEvent(req.params.id, updateData);
      res.json(updatedEvent);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.post("/api/events/:id/cancel", requireAuth, async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const cancelledEvent = await storage.updateEvent(req.params.id, { status: "cancelled" });
      const invitations2 = await storage.getInvitationsByEventId(req.params.id);
      const acceptedInvitations = invitations2.filter((inv) => inv.rsvpStatus === "yes" && inv.email);
      for (const invitation of acceptedInvitations) {
        if (invitation.email) {
          try {
            await sendCancellationEmail({
              to: invitation.email,
              eventTitle: event.title,
              eventDate: formatDate(event.startDateTime),
              eventLocation: event.location || void 0,
              hostName: host.preferredName || host.firstName || host.name || host.email,
              guestName: invitation.name || void 0
            });
          } catch (error) {
            console.error(`Failed to send cancellation email to ${invitation.email}:`, error);
          }
        }
      }
      res.json({
        success: true,
        message: `Event cancelled. ${acceptedInvitations.length} cancellation emails sent.`,
        event: cancelledEvent
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.delete("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteEvent(req.params.id);
      res.json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.delete("/api/events/:eventId/guests/:invitationId", requireAuth, async (req, res) => {
    try {
      const { eventId, invitationId } = req.params;
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const invitation = await storage.getInvitationById(invitationId);
      if (!invitation || invitation.eventId !== eventId) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      await storage.removeInvitation(invitationId);
      res.json({ success: true, message: "Guest removed successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.put("/api/events/:eventId/guests/:invitationId/suspend", requireAuth, async (req, res) => {
    try {
      const { eventId, invitationId } = req.params;
      const { suspended } = req.body;
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const invitation = await storage.getInvitationById(invitationId);
      if (!invitation || invitation.eventId !== eventId) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      await storage.updateInvitationStatus(invitationId, { suspended });
      res.json({
        success: true,
        message: suspended ? "Guest suspended" : "Guest suspension removed"
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.put("/api/events/:eventId/guests/:invitationId/block", requireAuth, async (req, res) => {
    try {
      const { eventId, invitationId } = req.params;
      const { blocked } = req.body;
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const invitation = await storage.getInvitationById(invitationId);
      if (!invitation || invitation.eventId !== eventId) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      await storage.updateInvitationStatus(invitationId, { blocked });
      res.json({
        success: true,
        message: blocked ? "Guest blocked from messaging" : "Guest messaging restriction removed"
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/events/:id/invitations", requireAuth, async (req, res) => {
    try {
      const { email, phone } = req.body;
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const invitation = await storage.createInvitation(event.id, email, phone, req.body.name);
      res.json(invitation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/invitations/:token", async (req, res) => {
    try {
      const invitation = await storage.getInvitationByToken(req.params.token);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      const event = await storage.getEventById(invitation.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json({ invitation, event });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/invitations/:token/rsvp", async (req, res) => {
    try {
      const { rsvpStatus } = req.body;
      if (!["pending", "yes", "no", "maybe"].includes(rsvpStatus)) {
        return res.status(400).json({ error: "Invalid RSVP status" });
      }
      await storage.updateInvitationRSVP(req.params.token, rsvpStatus);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/events/:id/invitations", requireAuth, async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const invitations2 = await storage.getInvitationsByEventId(req.params.id);
      res.json(invitations2);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/events/:id/resend-invitations", requireAuth, async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const invitations2 = await storage.getInvitationsByEventId(req.params.id);
      const pendingInvitations = invitations2.filter((inv) => inv.rsvpStatus === "pending");
      let sentCount = 0;
      for (const invitation of pendingInvitations) {
        if (invitation.email) {
          const baseUrlForLinks = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : `${req.protocol || "http"}://${req.get("host") || "localhost:5000"}`;
          const inviteUrl = `${baseUrlForLinks}/invite/${invitation.token}`;
          const formatDate2 = (dateString) => {
            return new Date(dateString).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });
          };
          try {
            await sendInvitationEmail({
              to: invitation.email,
              eventTitle: event.title,
              eventDescription: event.description || void 0,
              eventDate: formatDate2(event.startDateTime),
              eventLocation: event.location || void 0,
              inviteUrl,
              hostEmail: req.user.email,
              guestName: invitation.name || void 0,
              hostName: host.name || void 0,
              token: invitation.token,
              baseUrl: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : `${req.protocol || "http"}://${req.get("host") || "localhost:5000"}`
            });
            sentCount++;
          } catch (error) {
            console.error(`Failed to resend invitation to ${invitation.email}:`, error);
          }
        }
      }
      res.json({
        success: true,
        message: `${sentCount} pending invitations resent successfully`
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/events/:id/add-invitations", requireAuth, async (req, res) => {
    try {
      const { guests } = req.body;
      if (!guests || !Array.isArray(guests) || guests.length === 0) {
        return res.status(400).json({ error: "Guest information is required" });
      }
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const existingInvitations = await storage.getInvitationsByEventId(req.params.id);
      const existingEmails = new Set(existingInvitations.map((inv) => inv.email).filter(Boolean));
      const newInvitations = [];
      for (const guest of guests) {
        if (guest.email && guest.email.trim() && !existingEmails.has(guest.email.trim())) {
          const invitation = await storage.createInvitation(event.id, guest.email.trim(), void 0, guest.name || void 0);
          newInvitations.push(invitation);
          const inviteUrl = `${req.protocol}://${req.get("host")}/invite/${invitation.token}`;
          const formatDate2 = (dateString) => {
            return new Date(dateString).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });
          };
          try {
            await sendInvitationEmail({
              to: guest.email.trim(),
              eventTitle: event.title,
              eventDescription: event.description || void 0,
              eventDate: formatDate2(event.startDateTime),
              eventLocation: event.location || void 0,
              inviteUrl,
              hostEmail: req.user.email,
              guestName: guest.name || void 0,
              hostName: host.name || void 0,
              token: invitation.token,
              baseUrl: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : `${req.protocol || "http"}://${req.get("host") || "localhost:5000"}`
            });
          } catch (error) {
            console.error(`Failed to send invitation to ${guest.email}:`, error);
          }
        }
      }
      res.json({ invitations: newInvitations });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.post("/api/invitations/:id/resend", requireAuth, async (req, res) => {
    try {
      const invitation = await storage.getInvitationById(req.params.id);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      const event = await storage.getEventById(invitation.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (!invitation.email) {
        return res.status(400).json({ error: "No email address for this invitation" });
      }
      const baseUrlForLinks = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : `${req.protocol || "http"}://${req.get("host") || "localhost:5000"}`;
      const inviteUrl = `${baseUrlForLinks}/invite/${invitation.token}`;
      const formatDate2 = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      };
      try {
        await sendInvitationEmail({
          to: invitation.email,
          eventTitle: event.title,
          eventDescription: event.description || void 0,
          eventDate: formatDate2(event.startDateTime),
          eventLocation: event.location || void 0,
          inviteUrl,
          hostEmail: req.user.email,
          guestName: invitation.name || void 0,
          hostName: host.preferredName || host.firstName || host.name || void 0,
          token: invitation.token,
          baseUrl: baseUrlForLinks
        });
        res.json({
          success: true,
          message: "Invitation resent successfully"
        });
      } catch (error) {
        console.error(`Failed to resend invitation to ${invitation.email}:`, error);
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/events/:id/messages", async (req, res) => {
    try {
      const { token } = req.query;
      if (token) {
        const invitation = await storage.getInvitationByToken(token);
        if (!invitation || invitation.eventId !== req.params.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else {
        if (!req.session.userId) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const user = await storage.getUserById(req.session.userId);
        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }
        const event = await storage.getEventById(req.params.id);
        if (!event) {
          return res.status(404).json({ error: "Event not found" });
        }
        const host = await storage.getHostByUserId(user.id);
        if (!host || event.hostId !== host.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      const messages = await storage.getEventMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/events/:id/messages", async (req, res) => {
    try {
      const { message, token } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message is required" });
      }
      let senderType;
      let senderId = null;
      if (token) {
        const invitation = await storage.getInvitationByToken(token);
        if (!invitation || invitation.eventId !== req.params.id) {
          return res.status(403).json({ error: "Access denied" });
        }
        senderType = "guest";
        senderId = invitation.id;
      } else {
        if (!req.session.userId) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const user = await storage.getUserById(req.session.userId);
        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }
        const event = await storage.getEventById(req.params.id);
        if (!event) {
          return res.status(404).json({ error: "Event not found" });
        }
        const host = await storage.getHostByUserId(user.id);
        if (!host || event.hostId !== host.id) {
          return res.status(403).json({ error: "Access denied" });
        }
        senderType = "host";
        senderId = host.id;
      }
      const newMessage = await storage.createEventMessage(
        req.params.id,
        senderType,
        senderId,
        message.trim()
      );
      res.json(newMessage);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/host/profile", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      res.json(host);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.put("/api/host/profile", requireAuth, async (req, res) => {
    try {
      const profileData = updateHostProfileSchema.parse(req.body);
      const updatedHost = await storage.updateHostProfile(req.user.id, profileData);
      res.json(updatedHost);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/events/:id/collaborators", requireAuth, async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const collaborators = await storage.getEventCollaborators(req.params.id);
      res.json(collaborators);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/events/:id/collaborators", requireAuth, async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const { userId, role, permissions } = insertEventCollaboratorSchema.omit({ eventId: true }).parse(req.body);
      const collaboratorUser = await storage.getUserById(userId);
      if (!collaboratorUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const collaborator = await storage.createEventCollaborator(req.params.id, userId, req.user.id, {
        role,
        permissions
      });
      res.json(collaborator);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.put("/api/events/:eventId/collaborators/:id", requireAuth, async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const updateData = updateEventCollaboratorSchema.parse(req.body);
      const updatedCollaborator = await storage.updateEventCollaborator(req.params.id, updateData);
      res.json(updatedCollaborator);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/events/:eventId/collaborators/:id", requireAuth, async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteEventCollaborator(req.params.id);
      res.json({ success: true, message: "Collaborator removed successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/collaborated-events", requireAuth, async (req, res) => {
    try {
      const collaborations = await storage.getUserCollaboratedEvents(req.user.id);
      res.json(collaborations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/announcements", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const announcements2 = await storage.getAnnouncementsByHostId(host.id);
      res.json(announcements2);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/announcements", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const { sendEmail, specificUserEmails, ...announcementData } = req.body;
      const announcement = await storage.createAnnouncement(host.id, insertAnnouncementSchema.parse(announcementData));
      if (sendEmail) {
        let emailRecipients = [];
        if (announcementData.targetAudience === "all_users") {
          const guestLists2 = await storage.getGuestListsByHostId(host.id);
          for (const list of guestLists2) {
            const members = await storage.getGuestListMembers(list.id);
            emailRecipients.push(...members.map((m) => m.email));
          }
        } else if (announcementData.targetAudience === "event_attendees" && announcementData.eventId) {
          const invitations2 = await storage.getInvitationsByEventId(announcementData.eventId);
          emailRecipients = invitations2.filter((inv) => inv.rsvpStatus === "yes").map((inv) => inv.email).filter((email) => email !== null);
        } else if (announcementData.targetAudience === "specific_users" && specificUserEmails) {
          emailRecipients = specificUserEmails;
        }
        const uniqueRecipients = Array.from(new Set(emailRecipients));
        if (uniqueRecipients.length > 0) {
          await sendAnnouncementEmail({
            to: uniqueRecipients,
            title: announcement.title,
            content: announcement.content,
            hostName: host.preferredName || `${host.firstName} ${host.lastName}`.trim() || void 0
          });
        }
      }
      res.json(announcement);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.put("/api/announcements/:id", requireAuth, async (req, res) => {
    try {
      const announcement = await storage.getAnnouncementById(req.params.id);
      if (!announcement) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || announcement.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const updateData = req.body;
      const updatedAnnouncement = await storage.updateAnnouncement(req.params.id, updateData);
      res.json(updatedAnnouncement);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.post("/api/announcements/:id/publish", requireAuth, async (req, res) => {
    try {
      const announcement = await storage.getAnnouncementById(req.params.id);
      if (!announcement) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || announcement.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const publishedAnnouncement = await storage.publishAnnouncement(req.params.id);
      res.json(publishedAnnouncement);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.delete("/api/announcements/:id", requireAuth, async (req, res) => {
    try {
      const announcement = await storage.getAnnouncementById(req.params.id);
      if (!announcement) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || announcement.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteAnnouncement(req.params.id);
      res.json({ success: true, message: "Announcement deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/polls", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const polls2 = await storage.getPollsByHostId(host.id);
      res.json(polls2);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/polls", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const { sendEmail, notifyGuestListIds, ...pollData } = req.body;
      const poll = await storage.createPoll(host.id, insertPollSchema.parse(pollData));
      if (sendEmail && notifyGuestListIds && notifyGuestListIds.length > 0) {
        let emailRecipients = [];
        for (const guestListId of notifyGuestListIds) {
          const members = await storage.getGuestListMembers(guestListId);
          emailRecipients.push(...members.map((m) => m.email));
        }
        const uniqueRecipients = Array.from(new Set(emailRecipients));
        if (uniqueRecipients.length > 0) {
          await sendPollEmail({
            to: uniqueRecipients,
            title: poll.title,
            description: poll.description ?? void 0,
            options: poll.options,
            endDate: poll.endDate,
            hostName: host.preferredName || `${host.firstName} ${host.lastName}`.trim() || void 0,
            pollId: poll.id,
            baseUrl: getBaseUrl(req)
          });
        }
      }
      res.json(poll);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/polls/:id", async (req, res) => {
    try {
      const poll = await storage.getPollById(req.params.id);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      const votes = await storage.getPollVotes(req.params.id);
      const voteCounts = poll.options.map((_, index) => {
        return votes.filter((vote) => vote.selectedOptions.includes(index.toString())).length;
      });
      res.json({ ...poll, voteCounts, totalVotes: votes.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/polls/:id/vote", async (req, res) => {
    try {
      const poll = await storage.getPollById(req.params.id);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      if (poll.status !== "active") {
        return res.status(400).json({ error: "Poll is not active" });
      }
      if (/* @__PURE__ */ new Date() > poll.endDate) {
        return res.status(400).json({ error: "Poll has ended" });
      }
      const voteData = insertPollVoteSchema.parse(req.body);
      const existingVote = await storage.getUserPollVote(
        req.params.id,
        voteData.userId || void 0,
        voteData.voterEmail || void 0
      );
      if (existingVote) {
        const updatedVote = await storage.updatePollVote(existingVote.id, voteData.selectedOptions);
        res.json(updatedVote);
      } else {
        const vote = await storage.createPollVote({
          pollId: req.params.id,
          userId: voteData.userId || null,
          voterEmail: voteData.voterEmail || null,
          voterName: voteData.voterName || null,
          selectedOptions: voteData.selectedOptions
        });
        res.json(vote);
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.put("/api/polls/:id", requireAuth, async (req, res) => {
    try {
      const poll = await storage.getPollById(req.params.id);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || poll.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const { sendEmail, notifyGuestListIds, ...updateData } = req.body;
      const validatedData = updatePollSchema.parse(updateData);
      const updatedPoll = await storage.updatePoll(req.params.id, validatedData);
      if (sendEmail && notifyGuestListIds && notifyGuestListIds.length > 0) {
        let emailRecipients = [];
        for (const guestListId of notifyGuestListIds) {
          const members = await storage.getGuestListMembers(guestListId);
          emailRecipients.push(...members.map((m) => m.email));
        }
        const uniqueRecipients = Array.from(new Set(emailRecipients));
        if (uniqueRecipients.length > 0) {
          await sendPollEmail({
            to: uniqueRecipients,
            title: updatedPoll.title,
            description: updatedPoll.description || void 0,
            options: updatedPoll.options,
            endDate: updatedPoll.endDate instanceof Date ? updatedPoll.endDate : new Date(updatedPoll.endDate),
            hostName: host.preferredName || `${host.firstName} ${host.lastName}`.trim() || void 0,
            pollId: updatedPoll.id,
            baseUrl: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : `${req.protocol || "https"}://${req.get("host") || "localhost:5000"}`
          });
        }
      }
      res.json(updatedPoll);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.post("/api/polls/:id/end", requireAuth, async (req, res) => {
    try {
      const poll = await storage.getPollById(req.params.id);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || poll.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const endedPoll = await storage.endPoll(req.params.id);
      res.json(endedPoll);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/polls/:id/vote-email", async (req, res) => {
    try {
      const poll = await storage.getPollById(req.params.id);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      if (poll.status !== "active") {
        return res.status(400).json({ error: "Poll is not active" });
      }
      if (/* @__PURE__ */ new Date() > poll.endDate) {
        return res.status(400).json({ error: "Poll has ended" });
      }
      const optionIndex = parseInt(req.query.option);
      const voterEmail = req.query.voterEmail;
      if (isNaN(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) {
        return res.status(400).json({ error: "Invalid option" });
      }
      if (!voterEmail || voterEmail === "USER_EMAIL") {
        return res.redirect(`/polls/${req.params.id}`);
      }
      const existingVote = await storage.getUserPollVote(
        req.params.id,
        void 0,
        voterEmail
      );
      if (existingVote) {
        await storage.updatePollVote(existingVote.id, [optionIndex.toString()]);
      } else {
        await storage.createPollVote({
          pollId: req.params.id,
          userId: null,
          voterEmail: voterEmail || null,
          voterName: null,
          selectedOptions: [optionIndex.toString()]
        });
      }
      res.redirect(`/polls/${req.params.id}?voted=true`);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/polls/:id/convert-to-event", requireAuth, async (req, res) => {
    try {
      const poll = await storage.getPollById(req.params.id);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || poll.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const { eventData } = req.body;
      const event = await storage.createEvent(
        host.id,
        eventData.title || poll.title,
        eventData.description || poll.description,
        new Date(eventData.startDateTime),
        eventData.endDateTime ? new Date(eventData.endDateTime) : null,
        eventData.location || null,
        eventData.exactAddress || null,
        eventData.customDirections || null,
        eventData.isAllDay || false,
        eventData.groupId || null
      );
      const convertedPoll = await storage.convertPollToEvent(req.params.id, event.id);
      res.json({ poll: convertedPoll, event });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/polls/:id", requireAuth, async (req, res) => {
    try {
      const poll = await storage.getPollById(req.params.id);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || poll.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deletePoll(req.params.id);
      res.json({ success: true, message: "Poll deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/objects/upload", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.put("/api/host-pictures", requireAuth, async (req, res) => {
    try {
      if (!req.body.pictureUrl) {
        return res.status(400).json({ error: "pictureUrl is required" });
      }
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.pictureUrl,
        {
          owner: req.user.id,
          visibility: "public"
          // Profile pictures are public
        }
      );
      res.status(200).json({
        objectPath
      });
    } catch (error) {
      console.error("Error setting picture:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error.name === "ObjectNotFoundError") {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });
  app2.get("/api/event-groups", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const eventGroups2 = await storage.getEventGroupsByHostId(host.id);
      res.json(eventGroups2);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/event-groups", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const eventGroup = await storage.createEventGroup(host.id, req.body);
      res.status(201).json(eventGroup);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.put("/api/event-groups/:id", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const eventGroup = await storage.getEventGroupById(req.params.id);
      if (!eventGroup || eventGroup.hostId !== host.id) {
        return res.status(404).json({ error: "Event group not found" });
      }
      const updatedGroup = await storage.updateEventGroup(req.params.id, req.body);
      res.json(updatedGroup);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/event-groups/:id", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const eventGroup = await storage.getEventGroupById(req.params.id);
      if (!eventGroup || eventGroup.hostId !== host.id) {
        return res.status(404).json({ error: "Event group not found" });
      }
      await storage.deleteEventGroup(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/event-groups/:id/guest-lists", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const eventGroup = await storage.getEventGroupById(req.params.id);
      if (!eventGroup || eventGroup.hostId !== host.id) {
        return res.status(404).json({ error: "Event group not found" });
      }
      const associations = await storage.getEventGroupGuestLists(req.params.id);
      res.json(associations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/event-groups/:id/guest-lists", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const eventGroup = await storage.getEventGroupById(req.params.id);
      if (!eventGroup || eventGroup.hostId !== host.id) {
        return res.status(404).json({ error: "Event group not found" });
      }
      const guestList = await storage.getGuestListById(req.body.guestListId);
      if (!guestList || guestList.hostId !== host.id) {
        return res.status(404).json({ error: "Guest list not found" });
      }
      const association = await storage.addGuestListToEventGroup(req.params.id, req.body.guestListId);
      res.status(201).json(association);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/event-groups/:id/guest-lists/:guestListId", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const eventGroup = await storage.getEventGroupById(req.params.id);
      if (!eventGroup || eventGroup.hostId !== host.id) {
        return res.status(404).json({ error: "Event group not found" });
      }
      await storage.removeGuestListFromEventGroup(req.params.id, req.params.guestListId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/guest-lists", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const guestLists2 = await storage.getGuestListsByHostId(host.id);
      const guestListsWithCounts = await Promise.all(guestLists2.map(async (list) => {
        const members = await storage.getGuestListMembers(list.id);
        return {
          ...list,
          memberCount: members.length
        };
      }));
      res.json(guestListsWithCounts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/guest-lists", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const guestList = await storage.createGuestList(host.id, req.body);
      res.status(201).json({ ...guestList, memberCount: 0 });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.put("/api/guest-lists/:id", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const guestList = await storage.getGuestListById(req.params.id);
      if (!guestList || guestList.hostId !== host.id) {
        return res.status(404).json({ error: "Guest list not found" });
      }
      const updatedList = await storage.updateGuestList(req.params.id, req.body);
      const members = await storage.getGuestListMembers(updatedList.id);
      res.json({ ...updatedList, memberCount: members.length });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/guest-lists/:id", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const guestList = await storage.getGuestListById(req.params.id);
      if (!guestList || guestList.hostId !== host.id) {
        return res.status(404).json({ error: "Guest list not found" });
      }
      await storage.deleteGuestList(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/guest-lists/:id/members", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const guestList = await storage.getGuestListById(req.params.id);
      if (!guestList || guestList.hostId !== host.id) {
        return res.status(404).json({ error: "Guest list not found" });
      }
      const members = await storage.getGuestListMembers(req.params.id);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/guest-lists/:id/members", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const guestList = await storage.getGuestListById(req.params.id);
      if (!guestList || guestList.hostId !== host.id) {
        return res.status(404).json({ error: "Guest list not found" });
      }
      const memberData = {
        ...req.body,
        guestListId: req.params.id
      };
      const member = await storage.createGuestListMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.put("/api/guest-lists/:listId/members/:memberId", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const guestList = await storage.getGuestListById(req.params.listId);
      if (!guestList || guestList.hostId !== host.id) {
        return res.status(404).json({ error: "Guest list not found" });
      }
      const member = await storage.updateGuestListMember(req.params.memberId, req.body);
      res.json(member);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/guest-lists/:listId/members/:memberId", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const guestList = await storage.getGuestListById(req.params.listId);
      if (!guestList || guestList.hostId !== host.id) {
        return res.status(404).json({ error: "Guest list not found" });
      }
      await storage.deleteGuestListMember(req.params.memberId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/guest-lists/:id/invite-to-event", requireAuth, async (req, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      const { eventId } = req.body;
      if (!eventId) {
        return res.status(400).json({ error: "Event ID is required" });
      }
      const [guestList, event] = await Promise.all([
        storage.getGuestListById(req.params.id),
        storage.getEventById(eventId)
      ]);
      if (!guestList || guestList.hostId !== host.id) {
        return res.status(404).json({ error: "Guest list not found" });
      }
      if (!event || event.hostId !== host.id) {
        return res.status(404).json({ error: "Event not found" });
      }
      const members = await storage.getGuestListMembers(req.params.id);
      const invitations2 = [];
      for (const member of members) {
        const invitation = await storage.createInvitation(
          eventId,
          member.email,
          member.phone || void 0,
          member.name
        );
        invitations2.push(invitation);
        try {
          await sendInvitationEmail({
            to: member.email,
            eventTitle: event.title,
            eventDescription: event.description || void 0,
            eventDate: formatDate(event.startDateTime),
            eventLocation: event.location || void 0,
            inviteUrl: `${process.env.APP_URL || "http://localhost:5000"}/invite/${invitation.token}`,
            hostEmail: host.email,
            guestName: member.name,
            hostName: host.name || host.email,
            token: invitation.token,
            baseUrl: process.env.APP_URL || "http://localhost:5000"
          });
        } catch (emailError) {
          console.error("Failed to send invitation email:", emailError);
        }
      }
      res.json({
        success: true,
        invitationCount: invitations2.length,
        invitations: invitations2
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/rsvp/:token/:response", async (req, res) => {
    try {
      const { token, response } = req.params;
      if (!["yes", "no", "maybe"].includes(response)) {
        return res.status(400).json({ error: "Invalid RSVP response" });
      }
      const invitation = await storage.getInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      await storage.updateInvitationRSVP(token, response);
      const event = await storage.getEventById(invitation.eventId);
      if (event) {
        res.redirect(`/invite/${token}?rsvp=${response}&confirmed=true`);
      } else {
        res.status(404).json({ error: "Event not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vercel-entry.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV,
    time: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var initPromise = registerRoutes(app).then(() => {
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Vercel Express Error:", err);
    res.status(status).json({ message });
  });
});
async function handler(req, res) {
  await initPromise;
  return app(req, res);
}
export {
  handler as default
};
