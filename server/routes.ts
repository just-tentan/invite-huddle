import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertUserSchema, insertEventSchema } from "@shared/schema";

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
      console.log("Received body:", JSON.stringify(req.body, null, 2));
      const parsed = insertEventSchema.parse(req.body);
      console.log("Parsed data:", JSON.stringify(parsed, null, 2));
      const { title, description, dateTime, location } = parsed;
      
      const host = await storage.getHostByUserId(req.user.id);
      if (!host) {
        return res.status(404).json({ error: "Host profile not found" });
      }

      const event = await storage.createEvent(
        host.id,
        title,
        description || null,
        dateTime, // dateTime is already transformed to Date by schema
        location || null
      );
      
      res.json(event);
    } catch (error: any) {
      console.log("Full validation error:", error);
      if (error.errors) {
        console.log("Zod errors:", JSON.stringify(error.errors, null, 2));
      }
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

  const httpServer = createServer(app);

  return httpServer;
}
