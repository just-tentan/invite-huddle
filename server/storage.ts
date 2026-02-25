import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { 
  users, hosts, events, invitations, eventMessages, eventGroups, guestLists, guestListMembers, eventGroupGuestLists,
  eventCollaborators, announcements, polls, pollVotes,
  type User, type InsertUser, type Host, type Event, type Invitation, type EventMessage, 
  type EventGroup, type GuestList, type GuestListMember, type UpdateHostProfile, 
  type InsertEventGroup, type InsertGuestList, type InsertGuestListMember, type EventGroupGuestList, type InsertEventGroupGuestList,
  type EventCollaborator, type InsertEventCollaborator, type UpdateEventCollaborator,
  type Announcement, type InsertAnnouncement, type Poll, type InsertPoll, type PollVote, type InsertPollVote
} from "@shared/schema";
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
  createEvent(hostId: string, title: string, description: string | null, startDateTime: Date, endDateTime: Date | null, location: string | null, exactAddress: string | null, customDirections: string | null, isAllDay: boolean, groupId: string | null): Promise<Event>;
  updateEvent(id: string, updates: Partial<Event>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  
  // Invitation methods
  createInvitation(eventId: string, email?: string, phone?: string, name?: string): Promise<Invitation>;
  getInvitationById(id: string): Promise<Invitation | undefined>;
  getInvitationByToken(token: string): Promise<Invitation | undefined>;
  getInvitationsByEventId(eventId: string): Promise<Invitation[]>;
  updateInvitationRSVP(token: string, rsvpStatus: string): Promise<void>;
  removeInvitation(id: string): Promise<void>;
  updateInvitationStatus(id: string, status: { suspended?: boolean, blocked?: boolean }): Promise<void>;
  
  // Message methods
  getEventMessages(eventId: string): Promise<EventMessage[]>;
  createEventMessage(eventId: string, senderType: "host" | "guest", senderId: string | null, message: string): Promise<EventMessage>;
  
  // Event Group methods
  getEventGroupsByHostId(hostId: string): Promise<EventGroup[]>;
  getEventGroupById(id: string): Promise<EventGroup | undefined>;
  createEventGroup(hostId: string, data: InsertEventGroup): Promise<EventGroup>;
  updateEventGroup(id: string, data: Partial<EventGroup>): Promise<EventGroup>;
  deleteEventGroup(id: string): Promise<void>;
  
  // Event Group Guest List methods
  getEventGroupGuestLists(eventGroupId: string): Promise<EventGroupGuestList[]>;
  addGuestListToEventGroup(eventGroupId: string, guestListId: string): Promise<EventGroupGuestList>;
  removeGuestListFromEventGroup(eventGroupId: string, guestListId: string): Promise<void>;
  
  // Guest List methods
  getGuestListsByHostId(hostId: string): Promise<GuestList[]>;
  getGuestListById(id: string): Promise<GuestList | undefined>;
  createGuestList(hostId: string, data: InsertGuestList): Promise<GuestList>;
  updateGuestList(id: string, data: Partial<GuestList>): Promise<GuestList>;
  deleteGuestList(id: string): Promise<void>;
  
  // Guest List Member methods
  getGuestListMembers(guestListId: string): Promise<GuestListMember[]>;
  createGuestListMember(data: InsertGuestListMember): Promise<GuestListMember>;
  updateGuestListMember(id: string, data: Partial<GuestListMember>): Promise<GuestListMember>;
  deleteGuestListMember(id: string): Promise<void>;
  
  // Event Collaborator methods
  getEventCollaborators(eventId: string): Promise<EventCollaborator[]>;
  getEventCollaboratorById(id: string): Promise<EventCollaborator | undefined>;
  createEventCollaborator(eventId: string, userId: string, invitedBy: string, data: Omit<InsertEventCollaborator, 'eventId' | 'userId'>): Promise<EventCollaborator>;
  updateEventCollaborator(id: string, data: UpdateEventCollaborator): Promise<EventCollaborator>;
  deleteEventCollaborator(id: string): Promise<void>;
  getUserCollaboratedEvents(userId: string): Promise<EventCollaborator[]>;
  
  // Announcement methods
  getAnnouncementsByHostId(hostId: string): Promise<Announcement[]>;
  getAnnouncementById(id: string): Promise<Announcement | undefined>;
  createAnnouncement(hostId: string, data: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, data: Partial<Announcement>): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<void>;
  publishAnnouncement(id: string): Promise<Announcement>;
  
  // Poll methods
  getPollsByHostId(hostId: string): Promise<Poll[]>;
  getActivePollsByHostId(hostId: string): Promise<Poll[]>;
  getPollById(id: string): Promise<Poll | undefined>;
  createPoll(hostId: string, data: InsertPoll): Promise<Poll>;
  updatePoll(id: string, data: Partial<Poll>): Promise<Poll>;
  deletePoll(id: string): Promise<void>;
  endPoll(id: string): Promise<Poll>;
  convertPollToEvent(pollId: string, eventId: string): Promise<Poll>;
  
  // Poll Vote methods
  getPollVotes(pollId: string): Promise<PollVote[]>;
  createPollVote(data: InsertPollVote): Promise<PollVote>;
  getUserPollVote(pollId: string, userId?: string, voterEmail?: string): Promise<PollVote | undefined>;
  updatePollVote(id: string, selectedOptions: string[]): Promise<PollVote>;
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
    
    if (!result[0]) {
      throw new Error("User creation failed");
    }

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
    return db.select().from(events).where(eq(events.hostId, hostId)).orderBy(events.startDateTime);
  }

  async getEventById(id: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
    return result[0];
  }

  async createEvent(hostId: string, title: string, description: string | null, startDateTime: Date, endDateTime: Date | null, location: string | null, exactAddress: string | null, customDirections: string | null, isAllDay: boolean, groupId: string | null): Promise<Event> {
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
      groupId,
    }).returning();
    return result[0];
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const result = await db.update(events)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();
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

  async removeInvitation(id: string): Promise<void> {
    await db.delete(invitations).where(eq(invitations.id, id));
  }

  async updateInvitationStatus(id: string, status: { suspended?: boolean, blocked?: boolean }): Promise<void> {
    await db.update(invitations)
      .set({
        isSuspended: status.suspended,
        messageBlocked: status.blocked,
        updatedAt: new Date()
      })
      .where(eq(invitations.id, id));
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

  // Event Group methods
  async getEventGroupsByHostId(hostId: string): Promise<EventGroup[]> {
    return db.select().from(eventGroups).where(eq(eventGroups.hostId, hostId)).orderBy(eventGroups.createdAt);
  }

  async getEventGroupById(id: string): Promise<EventGroup | undefined> {
    const result = await db.select().from(eventGroups).where(eq(eventGroups.id, id)).limit(1);
    return result[0];
  }

  async createEventGroup(hostId: string, data: InsertEventGroup): Promise<EventGroup> {
    const result = await db.insert(eventGroups).values({
      hostId,
      ...data,
    }).returning();
    return result[0];
  }

  async updateEventGroup(id: string, data: Partial<EventGroup>): Promise<EventGroup> {
    const result = await db.update(eventGroups)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(eventGroups.id, id))
      .returning();
    return result[0];
  }

  async deleteEventGroup(id: string): Promise<void> {
    await db.delete(eventGroups).where(eq(eventGroups.id, id));
  }

  // Guest List methods
  async getGuestListsByHostId(hostId: string): Promise<GuestList[]> {
    return db.select().from(guestLists).where(eq(guestLists.hostId, hostId)).orderBy(guestLists.createdAt);
  }

  async getGuestListById(id: string): Promise<GuestList | undefined> {
    const result = await db.select().from(guestLists).where(eq(guestLists.id, id)).limit(1);
    return result[0];
  }

  async createGuestList(hostId: string, data: InsertGuestList): Promise<GuestList> {
    const result = await db.insert(guestLists).values({
      hostId,
      ...data,
    }).returning();
    return result[0];
  }

  async updateGuestList(id: string, data: Partial<GuestList>): Promise<GuestList> {
    const result = await db.update(guestLists)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(guestLists.id, id))
      .returning();
    return result[0];
  }

  async deleteGuestList(id: string): Promise<void> {
    await db.delete(guestLists).where(eq(guestLists.id, id));
  }

  // Guest List Member methods
  async getGuestListMembers(guestListId: string): Promise<GuestListMember[]> {
    return db.select().from(guestListMembers).where(eq(guestListMembers.guestListId, guestListId)).orderBy(guestListMembers.createdAt);
  }

  async createGuestListMember(data: InsertGuestListMember): Promise<GuestListMember> {
    const result = await db.insert(guestListMembers).values(data).returning();
    return result[0];
  }

  async updateGuestListMember(id: string, data: Partial<GuestListMember>): Promise<GuestListMember> {
    const result = await db.update(guestListMembers)
      .set(data)
      .where(eq(guestListMembers.id, id))
      .returning();
    return result[0];
  }

  async deleteGuestListMember(id: string): Promise<void> {
    await db.delete(guestListMembers).where(eq(guestListMembers.id, id));
  }
  
  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }
  
  // Event Group Guest List methods
  async getEventGroupGuestLists(eventGroupId: string): Promise<EventGroupGuestList[]> {
    return db.select().from(eventGroupGuestLists).where(eq(eventGroupGuestLists.eventGroupId, eventGroupId));
  }
  
  async addGuestListToEventGroup(eventGroupId: string, guestListId: string): Promise<EventGroupGuestList> {
    const result = await db.insert(eventGroupGuestLists).values({
      eventGroupId,
      guestListId,
    }).returning();
    return result[0];
  }
  
  async removeGuestListFromEventGroup(eventGroupId: string, guestListId: string): Promise<void> {
    await db.delete(eventGroupGuestLists)
      .where(
        and(
          eq(eventGroupGuestLists.eventGroupId, eventGroupId),
          eq(eventGroupGuestLists.guestListId, guestListId)
        )
      );
  }
  
  // Event Collaborator methods
  async getEventCollaborators(eventId: string): Promise<EventCollaborator[]> {
    return db.select().from(eventCollaborators).where(eq(eventCollaborators.eventId, eventId)).orderBy(eventCollaborators.createdAt);
  }
  
  async getEventCollaboratorById(id: string): Promise<EventCollaborator | undefined> {
    const result = await db.select().from(eventCollaborators).where(eq(eventCollaborators.id, id)).limit(1);
    return result[0];
  }
  
  async createEventCollaborator(eventId: string, userId: string, invitedBy: string, data: Omit<InsertEventCollaborator, 'eventId' | 'userId'>): Promise<EventCollaborator> {
    const result = await db.insert(eventCollaborators).values({
      eventId,
      userId,
      invitedBy,
      ...data,
    }).returning();
    return result[0];
  }
  
  async updateEventCollaborator(id: string, data: UpdateEventCollaborator): Promise<EventCollaborator> {
    const result = await db.update(eventCollaborators)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(eventCollaborators.id, id))
      .returning();
    return result[0];
  }
  
  async deleteEventCollaborator(id: string): Promise<void> {
    await db.delete(eventCollaborators).where(eq(eventCollaborators.id, id));
  }
  
  async getUserCollaboratedEvents(userId: string): Promise<EventCollaborator[]> {
    return db.select().from(eventCollaborators)
      .where(and(eq(eventCollaborators.userId, userId), eq(eventCollaborators.status, 'accepted')))
      .orderBy(eventCollaborators.createdAt);
  }
  
  // Announcement methods
  async getAnnouncementsByHostId(hostId: string): Promise<Announcement[]> {
    return db.select().from(announcements).where(eq(announcements.hostId, hostId)).orderBy(announcements.createdAt);
  }
  
  async getAnnouncementById(id: string): Promise<Announcement | undefined> {
    const result = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
    return result[0];
  }
  
  async createAnnouncement(hostId: string, data: InsertAnnouncement): Promise<Announcement> {
    const result = await db.insert(announcements).values({
      hostId,
      ...data,
    }).returning();
    return result[0];
  }
  
  async updateAnnouncement(id: string, data: Partial<Announcement>): Promise<Announcement> {
    const result = await db.update(announcements)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, id))
      .returning();
    return result[0];
  }
  
  async deleteAnnouncement(id: string): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }
  
  async publishAnnouncement(id: string): Promise<Announcement> {
    const result = await db.update(announcements)
      .set({
        isPublished: true,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, id))
      .returning();
    return result[0];
  }
  
  // Poll methods
  async getPollsByHostId(hostId: string): Promise<Poll[]> {
    return db.select().from(polls).where(eq(polls.hostId, hostId)).orderBy(polls.createdAt);
  }
  
  async getActivePollsByHostId(hostId: string): Promise<Poll[]> {
    return db.select().from(polls)
      .where(and(eq(polls.hostId, hostId), eq(polls.status, 'active')))
      .orderBy(polls.createdAt);
  }
  
  async getPollById(id: string): Promise<Poll | undefined> {
    const result = await db.select().from(polls).where(eq(polls.id, id)).limit(1);
    return result[0];
  }
  
  async createPoll(hostId: string, data: InsertPoll): Promise<Poll> {
    const result = await db.insert(polls).values({
      hostId,
      ...data,
    }).returning();
    return result[0];
  }
  
  async updatePoll(id: string, data: Partial<Poll>): Promise<Poll> {
    const result = await db.update(polls)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(polls.id, id))
      .returning();
    return result[0];
  }
  
  async deletePoll(id: string): Promise<void> {
    await db.delete(polls).where(eq(polls.id, id));
  }
  
  async endPoll(id: string): Promise<Poll> {
    const result = await db.update(polls)
      .set({
        status: 'ended',
        updatedAt: new Date(),
      })
      .where(eq(polls.id, id))
      .returning();
    return result[0];
  }
  
  async convertPollToEvent(pollId: string, eventId: string): Promise<Poll> {
    const result = await db.update(polls)
      .set({
        status: 'converted',
        convertedEventId: eventId,
        updatedAt: new Date(),
      })
      .where(eq(polls.id, pollId))
      .returning();
    return result[0];
  }
  
  // Poll Vote methods
  async getPollVotes(pollId: string): Promise<PollVote[]> {
    return db.select().from(pollVotes).where(eq(pollVotes.pollId, pollId)).orderBy(pollVotes.createdAt);
  }
  
  async createPollVote(data: InsertPollVote): Promise<PollVote> {
    const result = await db.insert(pollVotes).values(data).returning();
    return result[0];
  }
  
  async getUserPollVote(pollId: string, userId?: string, voterEmail?: string): Promise<PollVote | undefined> {
    let condition;
    if (userId) {
      condition = and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, userId));
    } else if (voterEmail) {
      condition = and(eq(pollVotes.pollId, pollId), eq(pollVotes.voterEmail, voterEmail));
    } else {
      return undefined;
    }
    
    const result = await db.select().from(pollVotes).where(condition).limit(1);
    return result[0];
  }
  
  async updatePollVote(id: string, selectedOptions: string[]): Promise<PollVote> {
    const result = await db.update(pollVotes)
      .set({ selectedOptions })
      .where(eq(pollVotes.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
