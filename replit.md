# Overview

This is a comprehensive vehicle management system built for Korean organizations to track vehicle usage, maintenance, and operations. The system provides functionality for managing drive records, maintenance logs, photo documentation, and Slack notifications. It features a React frontend with a modern UI built using shadcn/ui components and an Express.js backend with PostgreSQL database integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development
- **UI Library**: shadcn/ui components built on Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with CSS variables for theming support
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe forms

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Storage**: Google Cloud Storage for file uploads with object ACL system
- **API Design**: RESTful API with structured error handling and request logging middleware

## Database Schema
The system uses five main tables:
- **Users**: Store driver information with username and name
- **Vehicles**: Track vehicle details including plate number, model, mileage, and status
- **Drive Records**: Log vehicle usage with start/end times, mileage, purpose, and destinations
- **Vehicle Photos**: Store documentation photos linked to drive records
- **Maintenance Records**: Track vehicle maintenance history with costs and service details

## File Upload System
- **Object Storage**: Google Cloud Storage integration with Replit sidecar authentication
- **Upload Interface**: Uppy.js for modern file upload experience with drag-and-drop support
- **Access Control**: Custom object ACL system for managing file permissions

## Authentication & Authorization
- Currently uses a simple user system without authentication
- Object-level access control implemented for file storage
- Extensible design for future authentication integration

# External Dependencies

## Core Infrastructure
- **Database**: PostgreSQL via Neon Database (@neondatabase/serverless)
- **File Storage**: Google Cloud Storage with Replit integration
- **Communication**: Slack Web API for automated notifications

## Development Tools
- **Database Management**: Drizzle Kit for migrations and schema management
- **Build System**: Vite for frontend bundling, esbuild for server compilation
- **Development Environment**: Replit-specific plugins and configuration

## UI and UX Libraries
- **Component Library**: Comprehensive shadcn/ui component set with Radix UI primitives
- **File Uploads**: Uppy ecosystem (@uppy/core, @uppy/dashboard, @uppy/aws-s3)
- **Styling**: Tailwind CSS with PostCSS processing
- **Fonts**: Google Fonts integration (Inter, DM Sans, Architects Daughter, Fira Code, Geist Mono)

## Form and Data Handling
- **Validation**: Zod for runtime type checking and form validation
- **HTTP Client**: TanStack Query for data fetching and caching
- **Form Management**: React Hook Form with resolver integration

The system is designed to be production-ready with comprehensive error handling, logging, and a scalable architecture that can accommodate future feature additions and user growth.