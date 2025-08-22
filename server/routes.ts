import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertUserSchema, insertEventSchema } from "@shared/schema";
import { sendInvitationEmail } from "./email";

// Session middleware setup
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
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
      res.status(400).json({ error: error.message });
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
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/events", requireAuth, async (req: any, res) => {
    try {
      const { title, description, dateTime, location, emails } = req.body;
      const eventData = { title, description, dateTime, location };
      const parsed = insertEventSchema.parse(eventData);
      
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }

      const event = await storage.createEvent(
        host.id,
        parsed.title,
        parsed.description || null,
        parsed.dateTime,
        parsed.location || null
      );

      // Create invitations if emails are provided
      const invitations = [];
      if (emails && Array.isArray(emails) && emails.length > 0) {
        for (const email of emails) {
          if (email.trim()) {
            const invitation = await storage.createInvitation(event.id, email.trim());
            invitations.push(invitation);
            
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
                to: email.trim(),
                eventTitle: parsed.title,
                eventDescription: parsed.description || undefined,
                eventDate: formatDate(parsed.dateTime),
                eventLocation: parsed.location || undefined,
                inviteUrl,
                hostEmail: req.user.email
              });
            } catch (error) {
              console.error(`Failed to send invitation to ${email}:`, error);
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

      const invitation = await storage.createInvitation(event.id, email, phone);
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
      let sentCount = 0;

      for (const invitation of invitations) {
        if (invitation.email) {
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
              to: invitation.email,
              eventTitle: event.title,
              eventDescription: event.description || undefined,
              eventDate: formatDate(event.dateTime),
              eventLocation: event.location || undefined,
              inviteUrl,
              hostEmail: req.user.email
            });
            sentCount++;
          } catch (error) {
            console.error(`Failed to resend invitation to ${invitation.email}:`, error);
          }
        }
      }

      res.json({ 
        success: true, 
        message: `${sentCount} invitations resent successfully` 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add new invitations to an event
  app.post("/api/events/:id/add-invitations", requireAuth, async (req: any, res) => {
    try {
      const { emails } = req.body;

      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ error: "Email addresses are required" });
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
      for (const email of emails) {
        if (email.trim() && !existingEmails.has(email.trim())) {
          const invitation = await storage.createInvitation(event.id, email.trim());
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
              to: email.trim(),
              eventTitle: event.title,
              eventDescription: event.description || undefined,
              eventDate: formatDate(event.dateTime),
              eventLocation: event.location || undefined,
              inviteUrl,
              hostEmail: req.user.email
            });
          } catch (error) {
            console.error(`Failed to send invitation to ${email}:`, error);
          }
        }
      }

      res.json({ invitations: newInvitations });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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

  const httpServer = createServer(app);

  return httpServer;
}
