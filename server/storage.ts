import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, hosts, events, invitations, eventMessages, type User, type InsertUser, type Host, type Event, type Invitation, type EventMessage, type UpdateHostProfile } from "@shared/schema";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface IStorage {
  // Auth methods
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  
  // Host methods
  getHostByUserId(userId: string): Promise<Host | undefined>;
  createHost(userId: string, email: string, name?: string): Promise<Host>;
  updateHostProfile(userId: string, profile: UpdateHostProfile): Promise<Host>;
  
  // Event methods
  getEventsByHostId(hostId: string): Promise<Event[]>;
  getEventById(id: string): Promise<Event | undefined>;
  createEvent(hostId: string, title: string, description: string | null, dateTime: Date, location: string | null): Promise<Event>;
  
  // Invitation methods
  createInvitation(eventId: string, email?: string, phone?: string, name?: string): Promise<Invitation>;
  getInvitationById(id: string): Promise<Invitation | undefined>;
  getInvitationByToken(token: string): Promise<Invitation | undefined>;
  getInvitationsByEventId(eventId: string): Promise<Invitation[]>;
  updateInvitationRSVP(token: string, rsvpStatus: string): Promise<void>;
  
  // Message methods
  getEventMessages(eventId: string): Promise<EventMessage[]>;
  createEventMessage(eventId: string, senderType: "host" | "guest", senderId: string | null, message: string): Promise<EventMessage>;
}

export class DatabaseStorage implements IStorage {
  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await db.insert(users).values({
      email: user.email,
      password: hashedPassword,
    }).returning();
    
    // Also create a host profile
    await this.createHost(result[0].id, user.email);
    
    return result[0];
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async getHostByUserId(userId: string): Promise<Host | undefined> {
    const result = await db.select().from(hosts).where(eq(hosts.userId, userId)).limit(1);
    return result[0];
  }

  async createHost(userId: string, email: string, name?: string): Promise<Host> {
    const result = await db.insert(hosts).values({
      userId,
      email,
      name,
    }).returning();
    return result[0];
  }

  async updateHostProfile(userId: string, profile: UpdateHostProfile): Promise<Host> {
    const result = await db.update(hosts)
      .set({
        ...profile,
        updatedAt: new Date(),
      })
      .where(eq(hosts.userId, userId))
      .returning();
    return result[0];
  }

  async getEventsByHostId(hostId: string): Promise<Event[]> {
    return db.select().from(events).where(eq(events.hostId, hostId)).orderBy(events.dateTime);
  }

  async getEventById(id: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
    return result[0];
  }

  async createEvent(hostId: string, title: string, description: string | null, dateTime: Date, location: string | null): Promise<Event> {
    const result = await db.insert(events).values({
      hostId,
      title,
      description,
      dateTime,
      location,
    }).returning();
    return result[0];
  }

  async createInvitation(eventId: string, email?: string, phone?: string, name?: string): Promise<Invitation> {
    const token = crypto.randomBytes(32).toString('base64url');
    const result = await db.insert(invitations).values({
      eventId,
      token,
      email,
      phone,
      name,
    }).returning();
    return result[0];
  }

  async getInvitationById(id: string): Promise<Invitation | undefined> {
    const result = await db.select().from(invitations).where(eq(invitations.id, id)).limit(1);
    return result[0];
  }

  async getInvitationByToken(token: string): Promise<Invitation | undefined> {
    const result = await db.select().from(invitations).where(eq(invitations.token, token)).limit(1);
    return result[0];
  }

  async getInvitationsByEventId(eventId: string): Promise<Invitation[]> {
    return db.select().from(invitations).where(eq(invitations.eventId, eventId));
  }

  async updateInvitationRSVP(token: string, rsvpStatus: "pending" | "yes" | "no" | "maybe"): Promise<void> {
    await db.update(invitations)
      .set({ rsvpStatus })
      .where(eq(invitations.token, token));
  }

  async getEventMessages(eventId: string): Promise<EventMessage[]> {
    return db.select().from(eventMessages).where(eq(eventMessages.eventId, eventId)).orderBy(eventMessages.createdAt);
  }

  async createEventMessage(eventId: string, senderType: "host" | "guest", senderId: string | null, message: string): Promise<EventMessage> {
    const result = await db.insert(eventMessages).values({
      eventId,
      senderType,
      senderId,
      message,
    }).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
