# Backend Setup Guide

## Quick Start

### 1. Prerequisites
- PostgreSQL database (local or cloud)
- Node.js 18+ installed
- npm or yarn package manager

### 2. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL if not already installed
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql
# Windows: Download from postgresql.org

# Create database
createdb car_booking
```

#### Option B: Supabase (Recommended for quick start)
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Copy the connection string from Settings > Database

### 3. Environment Configuration

```bash
# Navigate to server directory
cd apps/server

# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
# Example PostgreSQL URL formats:
# Local: postgresql://postgres:password@localhost:5432/car_booking
# Supabase: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 4. Install Dependencies

```bash
# From project root
npm install

# Or from server directory
cd apps/server && npm install
```

### 5. Database Migration

```bash
# From server directory
cd apps/server

# Push schema to database
npm run db:push

# Seed with test data
npm run db:seed
```

### 6. Start Development Server

```bash
# From project root (starts all services)
npm run dev

# Or just the backend
cd apps/server && npm run dev
```

The backend will be available at `http://localhost:3000`

## Test Credentials (After Seeding)

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@company.com | password123 | Full system access |
| HR Manager | hr@company.com | password123 | HR approvals, reports |
| Sales Manager | sales.manager@company.com | password123 | Team approvals |
| Engineering Manager | eng.manager@company.com | password123 | Team approvals |
| Employee (Sales) | john.doe@company.com | password123 | Create bookings |
| Employee (Engineering) | jane.smith@company.com | password123 | Create bookings |
| Employee (Sales) | bob.wilson@company.com | password123 | Create bookings |

## API Endpoints

### tRPC Routes
- `GET /api/trpc/healthCheck` - Health check
- `POST /api/trpc/bookings.create` - Create booking
- `GET /api/trpc/bookings.list` - List bookings
- `GET /api/trpc/vehicles.list` - List vehicles
- `POST /api/trpc/approvals.approve` - Approve booking
- `POST /api/trpc/approvals.reject` - Reject booking
- `GET /api/trpc/notifications.list` - Get notifications
- `GET /api/trpc/reports.bookingHistory` - Booking reports

### Authentication
- `POST /api/auth/sign-in` - Sign in
- `POST /api/auth/sign-up` - Sign up
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session

## Database Management

```bash
# View database in GUI
npm run db:studio

# Generate migrations (after schema changes)
npm run db:generate

# Apply migrations
npm run db:migrate

# Reset and reseed database
npm run db:push && npm run db:seed
```

## Project Structure

```
apps/server/
├── src/
│   ├── app/              # Next.js app directory
│   │   └── api/          # API routes
│   ├── db/               # Database configuration
│   │   ├── schema/       # Drizzle schema definitions
│   │   ├── index.ts      # Database connection
│   │   └── seed.ts       # Seed data script
│   ├── lib/              # Utilities and configuration
│   │   ├── auth.ts       # Authentication setup
│   │   ├── trpc.ts       # tRPC configuration
│   │   └── validations/  # Zod validation schemas
│   ├── routers/          # tRPC routers
│   │   ├── booking.router.ts
│   │   ├── vehicle.router.ts
│   │   ├── approval.router.ts
│   │   ├── notification.router.ts
│   │   └── report.router.ts
│   └── services/         # Business logic services
│       ├── booking.service.ts
│       ├── approval.service.ts
│       ├── notification.service.ts
│       └── vehicle.service.ts
├── drizzle.config.ts     # Drizzle ORM configuration
├── package.json
└── .env                  # Environment variables (create from .env.example)
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `pg_ctl status`
- Check connection string format in `.env`
- Verify database exists: `psql -l`

### Schema Push Fails
- Check DATABASE_URL is set correctly
- Ensure database user has CREATE TABLE permissions
- Try dropping and recreating database if corrupted

### Authentication Issues
- Ensure BETTER_AUTH_SECRET is at least 32 characters
- Check BETTER_AUTH_URL matches your backend URL
- Verify CORS_ORIGIN includes your frontend URL

### Port Conflicts
- Backend defaults to port 3000
- Change port: `PORT=3001 npm run dev`
- Check what's using port: `lsof -i :3000`

## Production Deployment

### Recommended Platforms
1. **Vercel** (Easiest)
   - Push to GitHub
   - Import project in Vercel
   - Add environment variables
   - Deploy

2. **Railway** 
   - One-click PostgreSQL provisioning
   - Automatic deployments from GitHub
   - Built-in environment management

3. **Render**
   - Free PostgreSQL database
   - Automatic HTTPS
   - Easy scaling options

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=<production-db-url>
BETTER_AUTH_SECRET=<generate-secure-32-char-key>
BETTER_AUTH_URL=https://your-domain.com
CORS_ORIGIN=https://your-frontend-domain.com
EMAIL_API_KEY=<your-email-service-key>
```

### Security Checklist
- [ ] Use strong BETTER_AUTH_SECRET (min 32 chars)
- [ ] Enable HTTPS in production
- [ ] Set proper CORS origins
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Monitor error logs
- [ ] Implement audit logging