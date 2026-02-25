# EventHost - Private Event Management Platform

## Overview

EventHost is a minimal, private event management platform similar to Meetup but with enhanced privacy features. The application allows authenticated users to create private events, send secure invitations via unique links, track RSVPs, and communicate through real-time chat. The platform emphasizes privacy with invitation-only access and secure token-based event sharing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming support
- **State Management**: TanStack React Query for server state and React hooks for local state
- **Routing**: React Router for client-side navigation
- **Forms**: React Hook Form with Zod validation resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with PostgreSQL-backed store (connect-pg-simple + pg)
- **Authentication**: Password-based authentication using bcryptjs for hashing
- **API Design**: RESTful endpoints with JSON responses
- **Error Handling**: Centralized error middleware with structured error responses

### Database Architecture
- **ORM**: Drizzle ORM (postgres.js driver) for type-safe database operations
- **Database**: PostgreSQL (Replit-provided, auto-detects SSL mode from DATABASE_URL)
- **Session Store**: connect-pg-simple with pg driver (creates session table automatically)
- **Schema Design**: 
  - Users table for authentication
  - Hosts table linking users to host profiles
  - Events table with host relationships
  - Invitations table with unique tokens for secure access
  - Event messages table for chat functionality
  - Polls table with voting system, email notifications, and edit capabilities
  - Poll votes table for tracking user participation
- **Migrations**: Drizzle Kit for schema migrations and database management

### Authentication & Authorization
- **Session-based Authentication**: PostgreSQL-backed sessions via connect-pg-simple
- **Password Security**: bcryptjs hashing with salt rounds
- **Route Protection**: Middleware-based authentication guards
- **User Roles**: Host and guest distinction through separate tables

### Deployment
- **Local Dev**: `server/index.ts` — imports `./vite` for HMR, runs on port 5000
- **Vercel**: `api/index.ts` — separate entry point that does NOT import `./vite` (avoids dev dependency issues)
- **SSL Detection**: `server/db.ts` auto-detects SSL mode from DATABASE_URL (Replit uses sslmode=disable, Supabase uses SSL)
- **Base URL Helper**: `getBaseUrl(req)` in routes.ts checks REPLIT_DOMAINS, VERCEL_URL, then falls back to req host

### Key Design Patterns
- **Monorepo Structure**: Shared schema and types between client and server
- **Type Safety**: End-to-end TypeScript with shared interfaces
- **Component Composition**: Shadcn/ui pattern with compound components
- **Custom Hooks**: Abstracted authentication and data fetching logic
- **Progressive Enhancement**: Server-side sessions with client-side state synchronization

## External Dependencies

### Core Technologies
- **PostgreSQL**: Replit-provided database (auto-SSL detection for compatibility)
- **connect-pg-simple + pg**: PostgreSQL-backed session store for production reliability
- **Vite**: Frontend build tool with React plugin
- **Drizzle ORM**: Type-safe database operations and migrations

### UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, forms, navigation)
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation for forms and API data

### Development Tools
- **TypeScript**: Static type checking across the full stack
- **PostCSS**: CSS processing with Tailwind integration
- **ESBuild**: Fast bundling for production builds
- **Replit Integration**: Development environment plugins and banner