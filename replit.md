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
- **Session Management**: Express sessions with server-side storage
- **Authentication**: Password-based authentication using bcrypt for hashing
- **API Design**: RESTful endpoints with JSON responses
- **Error Handling**: Centralized error middleware with structured error responses

### Database Architecture
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Design**: 
  - Users table for authentication
  - Hosts table linking users to host profiles
  - Events table with host relationships
  - Invitations table with unique tokens for secure access
  - Event messages table for chat functionality
- **Migrations**: Drizzle Kit for schema migrations and database management

### Authentication & Authorization
- **Session-based Authentication**: Express sessions with configurable storage
- **Password Security**: bcrypt hashing with salt rounds
- **Route Protection**: Middleware-based authentication guards
- **User Roles**: Host and guest distinction through separate tables

### Key Design Patterns
- **Monorepo Structure**: Shared schema and types between client and server
- **Type Safety**: End-to-end TypeScript with shared interfaces
- **Component Composition**: Shadcn/ui pattern with compound components
- **Custom Hooks**: Abstracted authentication and data fetching logic
- **Progressive Enhancement**: Server-side sessions with client-side state synchronization

## External Dependencies

### Core Technologies
- **Neon Database**: PostgreSQL serverless database provider
- **Express Sessions**: Session management with configurable storage backends
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