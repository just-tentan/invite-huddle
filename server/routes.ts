import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import pgSession from "connect-pg-simple";
import pg from "pg";
import { storage } from "./storage";
import { insertUserSchema, insertEventSchema, updateHostProfileSchema, insertEventGroupSchema, insertGuestListSchema, insertGuestListMemberSchema, insertEventGroupGuestListSchema, insertEventCollaboratorSchema, updateEventCollaboratorSchema, insertAnnouncementSchema, insertPollSchema, updatePollSchema, insertPollVoteSchema } from "@shared/schema";
import { sendInvitationEmail, sendCancellationEmail, sendAnnouncementEmail, sendPollEmail } from "./email";
import { ObjectStorageService } from "./objectStorage";

const PostgresSessionStore = pgSession(session);

// Utility functions
const formatDate = (dateString: Date) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getBaseUrl = (req: any) => {
  if (process.env.REPLIT_DOMAINS) return `https://${process.env.REPLIT_DOMAINS}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `${req.protocol}://${req.get('host')}`;
};

// Session middleware setup
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.set("trust proxy", 1);
  app.use(session({
    store: new PostgresSessionStore({
      pool: new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 2
      }),
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication middleware
  const requireAuth = async (req: any, res: any, next: any) => {
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

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      const user = await storage.createUser({ email, password });
      req.session.userId = user.id;
      
      res.json({ user: { id: user.id, email: user.email } });
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(error.status || 500).json({ error: error.message || "Signup failed" });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/signout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Could not sign out" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", requireAuth, (req: any, res) => {
    res.json({ user: { id: req.user.id, email: req.user.email } });
  });

  // Event routes
  app.get("/api/events", requireAuth, async (req: any, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }

      const events = await storage.getEventsByHostId(host.id);
      
      // Add RSVP and message counts for each event
      const eventsWithCounts = await Promise.all(events.map(async (event) => {
        const [invitations, messages] = await Promise.all([
          storage.getInvitationsByEventId(event.id),
          storage.getEventMessages(event.id)
        ]);
        
        // Calculate RSVP counts
        const rsvpCounts = {
          total: invitations.length,
          yes: invitations.filter(i => i.rsvpStatus === 'yes').length,
          no: invitations.filter(i => i.rsvpStatus === 'no').length,
          maybe: invitations.filter(i => i.rsvpStatus === 'maybe').length,
          pending: invitations.filter(i => i.rsvpStatus === 'pending').length
        };
        
        return {
          ...event,
          rsvpCounts,
          messageCount: messages.length
        };
      }));
      
      res.json(eventsWithCounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/events", requireAuth, async (req: any, res) => {
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

      // Create invitations if guests are provided
      const invitations = [];
      if (guests && Array.isArray(guests) && guests.length > 0) {
        for (const guest of guests) {
          if (guest.email && guest.email.trim()) {
            const invitation = await storage.createInvitation(event.id, guest.email.trim(), undefined, guest.name || undefined);
            invitations.push(invitation);
            
            // Send invitation email
            const baseUrlForLinks = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : `${req.protocol || 'http'}://${req.get('host') || 'localhost:5000'}`;
            const inviteUrl = `${baseUrlForLinks}/invite/${invitation.token}`;
            const formatDate = (dateString: Date) => {
              return new Date(dateString).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            };

            try {
              await sendInvitationEmail({
                to: guest.email.trim(),
                eventTitle: parsed.title,
                eventDescription: parsed.description || undefined,
                eventDate: formatDate(parsed.startDateTime),
                eventLocation: parsed.location || undefined,
                inviteUrl,
                hostEmail: req.user.email,
                guestName: guest.name || undefined,
                hostName: host.preferredName || host.firstName || host.name || undefined,
                token: invitation.token,
                baseUrl: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : `${req.protocol || 'http'}://${req.get('host') || 'localhost:5000'}`
              });
            } catch (error) {
              console.error(`Failed to send invitation to ${guest.email}:`, error);
              // Continue processing other emails even if one fails
            }
          }
        }
      }
      
      res.json({ event, invitations });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/events/:id", requireAuth, async (req: any, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if user owns this event
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update event
  app.put("/api/events/:id", requireAuth, async (req: any, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if user owns this event
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
        groupId: req.body.groupId || null,
      };

      const updatedEvent = await storage.updateEvent(req.params.id, updateData);
      res.json(updatedEvent);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Cancel event
  app.post("/api/events/:id/cancel", requireAuth, async (req: any, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if user owns this event
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Update event status to cancelled
      const cancelledEvent = await storage.updateEvent(req.params.id, { status: "cancelled" });

      // Get all invitations with 'yes' RSVP status to send cancellation emails
      const invitations = await storage.getInvitationsByEventId(req.params.id);
      const acceptedInvitations = invitations.filter(inv => inv.rsvpStatus === 'yes' && inv.email);

      // Send cancellation emails
      for (const invitation of acceptedInvitations) {
        if (invitation.email) {
          try {
            await sendCancellationEmail({
              to: invitation.email,
              eventTitle: event.title,
              eventDate: formatDate(event.startDateTime),
              eventLocation: event.location || undefined,
              hostName: host.preferredName || host.firstName || host.name || host.email,
              guestName: invitation.name || undefined
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete event
  app.delete("/api/events/:id", requireAuth, async (req: any, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if user owns this event
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteEvent(req.params.id);
      res.json({ success: true, message: "Event deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Guest management routes
  app.delete("/api/events/:eventId/guests/:invitationId", requireAuth, async (req: any, res) => {
    try {
      const { eventId, invitationId } = req.params;
      
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if user owns this event
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/events/:eventId/guests/:invitationId/suspend", requireAuth, async (req: any, res) => {
    try {
      const { eventId, invitationId } = req.params;
      const { suspended } = req.body;
      
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if user owns this event
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const invitation = await storage.getInvitationById(invitationId);
      if (!invitation || invitation.eventId !== eventId) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      await storage.updateInvitationStatus(invitationId, { suspended: suspended });
      res.json({ 
        success: true, 
        message: suspended ? "Guest suspended" : "Guest suspension removed" 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/events/:eventId/guests/:invitationId/block", requireAuth, async (req: any, res) => {
    try {
      const { eventId, invitationId } = req.params;
      const { blocked } = req.body;
      
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if user owns this event
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const invitation = await storage.getInvitationById(invitationId);
      if (!invitation || invitation.eventId !== eventId) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      await storage.updateInvitationStatus(invitationId, { blocked: blocked });
      res.json({ 
        success: true, 
        message: blocked ? "Guest blocked from messaging" : "Guest messaging restriction removed" 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Invitation routes
  app.post("/api/events/:id/invitations", requireAuth, async (req: any, res) => {
    try {
      const { email, phone } = req.body;
      
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if user owns this event
      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const invitation = await storage.createInvitation(event.id, email, phone, req.body.name);
      res.json(invitation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Public invitation routes (for guests)
  app.get("/api/invitations/:token", async (req, res) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/invitations/:token/rsvp", async (req, res) => {
    try {
      const { rsvpStatus } = req.body;
      
      if (!["pending", "yes", "no", "maybe"].includes(rsvpStatus)) {
        return res.status(400).json({ error: "Invalid RSVP status" });
      }

      await storage.updateInvitationRSVP(req.params.token, rsvpStatus);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get event invitations (for event management page)
  app.get("/api/events/:id/invitations", requireAuth, async (req: any, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const invitations = await storage.getInvitationsByEventId(req.params.id);
      res.json(invitations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resend invitations for an event
  app.post("/api/events/:id/resend-invitations", requireAuth, async (req: any, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const host = await storage.getHostByUserId(req.user.id);
      if (!host || event.hostId !== host.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const invitations = await storage.getInvitationsByEventId(req.params.id);
      const pendingInvitations = invitations.filter(inv => inv.rsvpStatus === 'pending');
      let sentCount = 0;

      for (const invitation of pendingInvitations) {
        if (invitation.email) {
          const baseUrlForLinks = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : `${req.protocol || 'http'}://${req.get('host') || 'localhost:5000'}`;
          const inviteUrl = `${baseUrlForLinks}/invite/${invitation.token}`;
          const formatDate = (dateString: Date) => {
            return new Date(dateString).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          };

          try {
            await sendInvitationEmail({
              to: invitation.email,
              eventTitle: event.title,
              eventDescription: event.description || undefined,
              eventDate: formatDate(event.startDateTime),
              eventLocation: event.location || undefined,
              inviteUrl,
              hostEmail: req.user.email,
              guestName: invitation.name || undefined,
              hostName: host.name || undefined,
              token: invitation.token,
              baseUrl: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : `${req.protocol || 'http'}://${req.get('host') || 'localhost:5000'}`
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add new invitations to an event
  app.post("/api/events/:id/add-invitations", requireAuth, async (req: any, res) => {
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

      // Check for existing invitations to avoid duplicates
      const existingInvitations = await storage.getInvitationsByEventId(req.params.id);
      const existingEmails = new Set(existingInvitations.map(inv => inv.email).filter(Boolean));

      const newInvitations = [];
      for (const guest of guests) {
        if (guest.email && guest.email.trim() && !existingEmails.has(guest.email.trim())) {
          const invitation = await storage.createInvitation(event.id, guest.email.trim(), undefined, guest.name || undefined);
          newInvitations.push(invitation);

          // Send invitation email
          const inviteUrl = `${req.protocol}://${req.get('host')}/invite/${invitation.token}`;
          const formatDate = (dateString: Date) => {
            return new Date(dateString).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          };

          try {
            await sendInvitationEmail({
              to: guest.email.trim(),
              eventTitle: event.title,
              eventDescription: event.description || undefined,
              eventDate: formatDate(event.startDateTime),
              eventLocation: event.location || undefined,
              inviteUrl,
              hostEmail: req.user.email,
              guestName: guest.name || undefined,
              hostName: host.name || undefined,
              token: invitation.token,
              baseUrl: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : `${req.protocol || 'http'}://${req.get('host') || 'localhost:5000'}`
            });
          } catch (error) {
            console.error(`Failed to send invitation to ${guest.email}:`, error);
          }
        }
      }

      res.json({ invitations: newInvitations });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Resend individual invitation
  app.post("/api/invitations/:id/resend", requireAuth, async (req: any, res) => {
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

      const baseUrlForLinks = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : `${req.protocol || 'http'}://${req.get('host') || 'localhost:5000'}`;
      const inviteUrl = `${baseUrlForLinks}/invite/${invitation.token}`;
      const formatDate = (dateString: Date) => {
        return new Date(dateString).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      try {
        await sendInvitationEmail({
          to: invitation.email,
          eventTitle: event.title,
          eventDescription: event.description || undefined,
          eventDate: formatDate(event.startDateTime),
          eventLocation: event.location || undefined,
          inviteUrl,
          hostEmail: req.user.email,
          guestName: invitation.name || undefined,
          hostName: host.preferredName || host.firstName || host.name || undefined,
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Event messages routes
  app.get("/api/events/:id/messages", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (token) {
        // Guest access via invitation token
        const invitation = await storage.getInvitationByToken(token as string);
        if (!invitation || invitation.eventId !== req.params.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else {
        // Host access - requires authentication
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/events/:id/messages", async (req, res) => {
    try {
      const { message, token } = req.body;
      
      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message is required" });
      }

      let senderType: "host" | "guest";
      let senderId: string | null = null;

      if (token) {
        // Guest message via invitation token
        const invitation = await storage.getInvitationByToken(token);
        if (!invitation || invitation.eventId !== req.params.id) {
          return res.status(403).json({ error: "Access denied" });
        }
        senderType = "guest";
        senderId = invitation.id;
      } else {
        // Host message - requires authentication
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Host profile routes
  app.get("/api/host/profile", requireAuth, async (req: any, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }
      res.json(host);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/host/profile", requireAuth, async (req: any, res) => {
    try {
      const profileData = updateHostProfileSchema.parse(req.body);
      const updatedHost = await storage.updateHostProfile(req.user.id, profileData);
      res.json(updatedHost);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Event Collaborator routes
  app.get("/api/events/:id/collaborators", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/events/:id/collaborators", requireAuth, async (req: any, res) => {
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
      
      // Check if user exists
      const collaboratorUser = await storage.getUserById(userId);
      if (!collaboratorUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const collaborator = await storage.createEventCollaborator(req.params.id, userId, req.user.id, {
        role,
        permissions,
      });

      res.json(collaborator);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/events/:eventId/collaborators/:id", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/events/:eventId/collaborators/:id", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User's collaborated events
  app.get("/api/collaborated-events", requireAuth, async (req: any, res) => {
    try {
      const collaborations = await storage.getUserCollaboratedEvents(req.user.id);
      res.json(collaborations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Announcement routes
  app.get("/api/announcements", requireAuth, async (req: any, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }

      const announcements = await storage.getAnnouncementsByHostId(host.id);
      res.json(announcements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/announcements", requireAuth, async (req: any, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }

      const { sendEmail, specificUserEmails, ...announcementData } = req.body;
      const announcement = await storage.createAnnouncement(host.id, insertAnnouncementSchema.parse(announcementData));
      
      // Send emails if requested
      if (sendEmail) {
        let emailRecipients: string[] = [];
        
        if (announcementData.targetAudience === 'all_users') {
          // Get all users from guest lists
          const guestLists = await storage.getGuestListsByHostId(host.id);
          for (const list of guestLists) {
            const members = await storage.getGuestListMembers(list.id);
            emailRecipients.push(...members.map(m => m.email));
          }
        } else if (announcementData.targetAudience === 'event_attendees' && announcementData.eventId) {
          // Get event attendees
          const invitations = await storage.getInvitationsByEventId(announcementData.eventId);
          emailRecipients = invitations
            .filter(inv => inv.rsvpStatus === 'yes')
            .map(inv => inv.email)
            .filter((email): email is string => email !== null);
        } else if (announcementData.targetAudience === 'specific_users' && specificUserEmails) {
          emailRecipients = specificUserEmails;
        }
        
        // Remove duplicates and send emails
        const uniqueRecipients = Array.from(new Set(emailRecipients));
        if (uniqueRecipients.length > 0) {
          await sendAnnouncementEmail({
            to: uniqueRecipients,
            title: announcement.title,
            content: announcement.content,
            hostName: host.preferredName || `${host.firstName} ${host.lastName}`.trim() || undefined,
          });
        }
      }
      
      res.json(announcement);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/announcements/:id", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/announcements/:id/publish", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/announcements/:id", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Poll routes
  app.get("/api/polls", requireAuth, async (req: any, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }

      const polls = await storage.getPollsByHostId(host.id);
      res.json(polls);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/polls", requireAuth, async (req: any, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }

      const { sendEmail, notifyGuestListIds, ...pollData } = req.body;
      const poll = await storage.createPoll(host.id, insertPollSchema.parse(pollData));
      
      // Send emails if requested
      if (sendEmail && notifyGuestListIds && notifyGuestListIds.length > 0) {
        let emailRecipients: string[] = [];
        
        for (const guestListId of notifyGuestListIds) {
          const members = await storage.getGuestListMembers(guestListId);
          emailRecipients.push(...members.map(m => m.email));
        }
        
        // Remove duplicates and send emails
        const uniqueRecipients = Array.from(new Set(emailRecipients));
        if (uniqueRecipients.length > 0) {
          await sendPollEmail({
            to: uniqueRecipients,
            title: poll.title,
            description: poll.description ?? undefined,
            options: poll.options,
            endDate: poll.endDate,
            hostName: host.preferredName || `${host.firstName} ${host.lastName}`.trim() || undefined,
            pollId: poll.id,
            baseUrl: getBaseUrl(req),
          });
        }
      }
      
      res.json(poll);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/polls/:id", async (req, res) => {
    try {
      const poll = await storage.getPollById(req.params.id);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }

      const votes = await storage.getPollVotes(req.params.id);
      
      // Count votes for each option
      const voteCounts = poll.options.map((_, index) => {
        return votes.filter(vote => vote.selectedOptions.includes(index.toString())).length;
      });

      res.json({ ...poll, voteCounts, totalVotes: votes.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/polls/:id/vote", async (req, res) => {
    try {
      const poll = await storage.getPollById(req.params.id);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }

      if (poll.status !== 'active') {
        return res.status(400).json({ error: "Poll is not active" });
      }

      if (new Date() > poll.endDate) {
        return res.status(400).json({ error: "Poll has ended" });
      }

      const voteData = insertPollVoteSchema.parse(req.body);
      
      // Check if user has already voted
      const existingVote = await storage.getUserPollVote(
        req.params.id, 
        voteData.userId || undefined, 
        voteData.voterEmail || undefined
      );

      if (existingVote) {
        // Update existing vote
        const updatedVote = await storage.updatePollVote(existingVote.id, voteData.selectedOptions);
        res.json(updatedVote);
      } else {
        // Create new vote
        const vote = await storage.createPollVote({
          pollId: req.params.id,
          userId: voteData.userId || null,
          voterEmail: voteData.voterEmail || null,
          voterName: voteData.voterName || null,
          selectedOptions: voteData.selectedOptions,
        });
        res.json(vote);
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/polls/:id", requireAuth, async (req: any, res) => {
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
      
      // Validate and transform the update data
      const validatedData = updatePollSchema.parse(updateData);
      
      const updatedPoll = await storage.updatePoll(req.params.id, validatedData);
      
      // Send emails if requested
      if (sendEmail && notifyGuestListIds && notifyGuestListIds.length > 0) {
        let emailRecipients: string[] = [];
        
        for (const guestListId of notifyGuestListIds) {
          const members = await storage.getGuestListMembers(guestListId);
          emailRecipients.push(...members.map(m => m.email));
        }
        
        // Remove duplicates and send emails
        const uniqueRecipients = Array.from(new Set(emailRecipients));
        if (uniqueRecipients.length > 0) {
          await sendPollEmail({
            to: uniqueRecipients,
            title: updatedPoll.title,
            description: updatedPoll.description || undefined,
            options: updatedPoll.options,
            endDate: updatedPoll.endDate instanceof Date ? updatedPoll.endDate : new Date(updatedPoll.endDate),
            hostName: host.preferredName || `${host.firstName} ${host.lastName}`.trim() || undefined,
            pollId: updatedPoll.id,
            baseUrl: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : `${req.protocol || 'https'}://${req.get('host') || 'localhost:5000'}`,
          });
        }
      }
      
      res.json(updatedPoll);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/polls/:id/end", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Email voting endpoint
  app.get("/api/polls/:id/vote-email", async (req, res) => {
    try {
      const poll = await storage.getPollById(req.params.id);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }

      if (poll.status !== 'active') {
        return res.status(400).json({ error: "Poll is not active" });
      }

      if (new Date() > poll.endDate) {
        return res.status(400).json({ error: "Poll has ended" });
      }

      const optionIndex = parseInt(req.query.option as string);
      const voterEmail = req.query.voterEmail as string | undefined;

      if (isNaN(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) {
        return res.status(400).json({ error: "Invalid option" });
      }

      if (!voterEmail || voterEmail === 'USER_EMAIL') {
        // Redirect to poll page if no email provided
        return res.redirect(`/polls/${req.params.id}`);
      }

      // Check if user has already voted
      const existingVote = await storage.getUserPollVote(
        req.params.id, 
        undefined, 
        voterEmail
      );

      if (existingVote) {
        // Update existing vote
        await storage.updatePollVote(existingVote.id, [optionIndex.toString()]);
      } else {
        // Create new vote
        await storage.createPollVote({
          pollId: req.params.id,
          userId: null,
          voterEmail: voterEmail || null,
          voterName: null,
          selectedOptions: [optionIndex.toString()],
        });
      }

      // Redirect to a thank you page or poll results
      res.redirect(`/polls/${req.params.id}?voted=true`);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/polls/:id/convert-to-event", requireAuth, async (req: any, res) => {
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
      
      // Create event from poll data
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

      // Mark poll as converted
      const convertedPoll = await storage.convertPollToEvent(req.params.id, event.id);
      
      res.json({ poll: convertedPoll, event });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/polls/:id", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Object storage routes for profile pictures
  app.post("/api/objects/upload", requireAuth, async (req: any, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/host-pictures", requireAuth, async (req: any, res) => {
    try {
      if (!req.body.pictureUrl) {
        return res.status(400).json({ error: "pictureUrl is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.pictureUrl,
        {
          owner: req.user.id,
          visibility: "public", // Profile pictures are public
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error: any) {
      console.error("Error setting picture:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private objects (for profile pictures)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      console.error("Error serving object:", error);
      if (error.name === "ObjectNotFoundError") {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Event Group routes
  app.get("/api/event-groups", requireAuth, async (req: any, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }

      const eventGroups = await storage.getEventGroupsByHostId(host.id);
      res.json(eventGroups);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/event-groups", requireAuth, async (req: any, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }

      const eventGroup = await storage.createEventGroup(host.id, req.body);
      res.status(201).json(eventGroup);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/event-groups/:id", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/event-groups/:id", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Event Group Guest List routes
  app.get("/api/event-groups/:id/guest-lists", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/event-groups/:id/guest-lists", requireAuth, async (req: any, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }

      const eventGroup = await storage.getEventGroupById(req.params.id);
      if (!eventGroup || eventGroup.hostId !== host.id) {
        return res.status(404).json({ error: "Event group not found" });
      }

      // Check if guest list exists and belongs to this host
      const guestList = await storage.getGuestListById(req.body.guestListId);
      if (!guestList || guestList.hostId !== host.id) {
        return res.status(404).json({ error: "Guest list not found" });
      }

      const association = await storage.addGuestListToEventGroup(req.params.id, req.body.guestListId);
      res.status(201).json(association);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/event-groups/:id/guest-lists/:guestListId", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Guest List routes
  app.get("/api/guest-lists", requireAuth, async (req: any, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }

      const guestLists = await storage.getGuestListsByHostId(host.id);
      
      // Add member counts for each guest list
      const guestListsWithCounts = await Promise.all(guestLists.map(async (list) => {
        const members = await storage.getGuestListMembers(list.id);
        return {
          ...list,
          memberCount: members.length
        };
      }));
      
      res.json(guestListsWithCounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/guest-lists", requireAuth, async (req: any, res) => {
    try {
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }

      const guestList = await storage.createGuestList(host.id, req.body);
      res.status(201).json({ ...guestList, memberCount: 0 });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/guest-lists/:id", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/guest-lists/:id", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Guest List Member routes
  app.get("/api/guest-lists/:id/members", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/guest-lists/:id/members", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/guest-lists/:listId/members/:memberId", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/guest-lists/:listId/members/:memberId", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk invite from guest list
  app.post("/api/guest-lists/:id/invite-to-event", requireAuth, async (req: any, res) => {
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
      const invitations = [];

      for (const member of members) {
        const invitation = await storage.createInvitation(
          eventId,
          member.email,
          member.phone || undefined,
          member.name
        );
        invitations.push(invitation);

        // Send invitation email
        try {
          await sendInvitationEmail({
            to: member.email,
            eventTitle: event.title,
            eventDescription: event.description || undefined,
            eventDate: formatDate(event.startDateTime),
            eventLocation: event.location || undefined,
            inviteUrl: `${process.env.APP_URL || 'http://localhost:5000'}/invite/${invitation.token}`,
            hostEmail: host.email,
            guestName: member.name,
            hostName: host.name || host.email,
            token: invitation.token,
            baseUrl: process.env.APP_URL || 'http://localhost:5000'
          });
        } catch (emailError) {
          console.error('Failed to send invitation email:', emailError);
        }
      }

      res.json({
        success: true,
        invitationCount: invitations.length,
        invitations
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // RSVP routes for direct email responses
  app.get("/api/rsvp/:token/:response", async (req: any, res) => {
    try {
      const { token, response } = req.params;
      
      if (!['yes', 'no', 'maybe'].includes(response)) {
        return res.status(400).json({ error: "Invalid RSVP response" });
      }

      const invitation = await storage.getInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      await storage.updateInvitationRSVP(token, response);
      
      // Redirect to event page with confirmation
      const event = await storage.getEventById(invitation.eventId);
      if (event) {
        res.redirect(`/invite/${token}?rsvp=${response}&confirmed=true`);
      } else {
        res.status(404).json({ error: "Event not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
