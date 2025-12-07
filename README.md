# Sarovar Progress Tracker

A full-stack hotel pre-opening progress tracker application for managing onboarding checklists across hotel properties.

## Features

- **Admin Dashboard**: Manage multiple hotels, view progress summaries, create new hotels with partner accounts
- **User Dashboard**: Track and update 80+ checklist items across departments
- **Progress Tracking**: Real-time progress visualization with charts and filters
- **Department-wise Organization**: Filter tasks by Engineering, HR, IT, Security, Housekeeping, etc.
- **Status Management**: Three-state workflow (Pending → In Progress → Done)
- **Forward-only Progression**: Users can only move tasks forward; admins can override
- **Audit Trail**: Complete history of all status changes
- **Firebase Authentication**: Secure login with role-based access

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | pnpm workspaces |
| Frontend | React 18, Vite, TypeScript, TanStack Query, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript, Prisma |
| Database | PostgreSQL |
| Auth | Firebase Authentication |

## Project Structure

```
sarovar-survey/
├── packages/
│   ├── frontend/          # React + Vite application
│   ├── backend/           # Express API server
│   └── shared/            # Shared types and constants
├── pnpm-workspace.yaml
└── package.json
```

## Prerequisites

- Node.js >= 18
- pnpm >= 8
- PostgreSQL database
- Firebase project (for authentication)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd sarovar-survey
pnpm install
```

### 2. Configure Environment Variables

Create `.env` file in `packages/backend/`:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/sarovar_survey?schema=public"

# Server
PORT=3001
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

Create `.env` file in `packages/frontend/`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed the database with departments, categories, and questions
pnpm db:seed
```

### 4. Run Development Servers

```bash
# Run both frontend and backend
pnpm dev

# Or run individually
pnpm dev:backend   # Backend on http://localhost:3001
pnpm dev:frontend  # Frontend on http://localhost:5173
```

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Email/Password authentication
3. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Use the values in your backend `.env`
4. Get web app config:
   - Go to Project Settings > General
   - Add a web app and copy the config values to frontend `.env`

## Usage

### Admin Flow

1. Login with admin credentials
2. View all hotels and their progress
3. Create new hotels with partner accounts
4. View detailed task lists per hotel
5. Override task statuses if needed
6. View audit logs for all changes

### User (Partner) Flow

1. Receive login credentials from admin
2. Reset password via email link
3. View assigned hotel's checklist
4. Update task statuses (forward only: Pending → In Progress → Done)
5. Set estimated completion dates
6. Track progress by department

## API Endpoints

### Auth
- `POST /api/auth/verify` - Verify Firebase token
- `GET /api/auth/me` - Get current user

### Admin
- `GET /api/admin/hotels` - List all hotels with progress
- `POST /api/admin/hotels` - Create hotel + partner account
- `GET /api/admin/hotels/:id` - Get hotel details with tasks
- `PATCH /api/admin/tasks/:id` - Update task status (any direction)
- `GET /api/admin/audit-logs/:hotelId` - Get audit logs

### User
- `GET /api/user/dashboard` - Get dashboard stats
- `GET /api/user/tasks` - Get all tasks with filters
- `PATCH /api/user/tasks/:questionId` - Update task (forward only)

## Database Schema

- **User**: Stores admin and partner users
- **Hotel**: Hotel properties
- **Department**: Task departments (Engineering, HR, etc.)
- **Category**: Task categories (Fire Safety, Guest Rooms, etc.)
- **Question**: 80+ pre-opening checklist items
- **TaskProgress**: Status tracking per hotel-question
- **AuditLog**: History of all status changes

## License

ISC

