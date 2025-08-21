# Car Booking System - Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [System Components](#system-components)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Database Design](#database-design)
8. [API Design](#api-design)
9. [Deployment Architecture](#deployment-architecture)
10. [Performance Considerations](#performance-considerations)
11. [Scalability Strategy](#scalability-strategy)
12. [Development Guidelines](#development-guidelines)

## System Overview

The Car Booking System is a modern web application designed to manage corporate vehicle reservations with a multi-level approval workflow. Built as a monorepo architecture, it provides a comprehensive solution for employees to book vehicles, managers to approve requests, and administrators to manage the fleet.

### Key Features
- Vehicle booking with date/time selection
- Multi-level approval workflow (Manager → HR)
- Real-time availability checking
- Fleet management dashboard
- Role-based access control
- Real-time notifications via SSE

### Architecture Style
- **Pattern**: Three-tier architecture with service layer
- **Structure**: Monorepo with Turborepo
- **API**: Type-safe RPC with tRPC
- **Database**: PostgreSQL with ORM abstraction

## Technology Stack

### Backend (`apps/server`)
| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Runtime | Node.js | 20+ | JavaScript runtime |
| Framework | Next.js | 15.3.0 | Full-stack React framework |
| API Layer | tRPC | 11.4.2 | Type-safe API endpoints |
| Database | PostgreSQL | 16+ | Primary data store |
| ORM | Drizzle | Latest | Database abstraction |
| Authentication | Better Auth | 1.3.4 | Session management |
| Validation | Zod | 4.0.2 | Schema validation |
| Real-time | SSE | Native | Server-sent events |

### Frontend (`apps/web`)
| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | Next.js | 15.3.0 | React framework |
| UI Library | React | 19.0.0 | Component library |
| State Management | TanStack Query | 5.80.5 | Server state management |
| UI Components | Radix UI | Latest | Accessible components |
| Styling | Tailwind CSS | 3.4.17 | Utility-first CSS |
| Forms | React Hook Form | 7.62.0 | Form management |
| Type Safety | TypeScript | 5+ | Static typing |

## Architecture Patterns

### 1. Service Layer Pattern
```typescript
// Centralized business logic in service layer
class BookingService {
  async createBooking(data: BookingInput): Promise<Booking> {
    // Business logic validation
    // Database operations
    // Event emission
  }
}
```

### 2. Dependency Injection Container
```typescript
// IoC container for managing dependencies
class ServiceContainer {
  private static instance: ServiceContainer;
  
  private constructor() {
    this.notificationService = new NotificationService();
    this.bookingService = new BookingService(this.notificationService);
    this.approvalService = new ApprovalService(this.notificationService);
  }
  
  static getInstance(): ServiceContainer {
    if (!this.instance) {
      this.instance = new ServiceContainer();
    }
    return this.instance;
  }
}
```

### 3. Repository Pattern
```typescript
// Data access abstraction
class BookingRepository {
  async findById(id: string): Promise<Booking | null> {
    return db.query.bookings.findFirst({
      where: eq(bookings.id, id)
    });
  }
}
```

### 4. Middleware Pipeline
```typescript
// Request processing pipeline
const middleware = [
  corsMiddleware,
  authMiddleware,
  rateLimitMiddleware,
  validationMiddleware
];
```

## System Components

### Backend Components

```
apps/server/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── api/             
│   │   │   ├── auth/        # Authentication endpoints
│   │   │   └── trpc/        # tRPC handler
│   │   └── route.ts         # Health check
│   │
│   ├── db/                  # Database layer
│   │   ├── schema/          # Database schemas
│   │   │   ├── auth.ts      # Auth tables
│   │   │   ├── bookings.ts  # Booking tables
│   │   │   └── vehicles.ts  # Vehicle tables
│   │   ├── index.ts         # Database connection
│   │   └── seed.ts          # Data seeding
│   │
│   ├── lib/                 # Core libraries
│   │   ├── auth.ts          # Authentication setup
│   │   ├── context.ts       # tRPC context
│   │   └── trpc.ts          # tRPC configuration
│   │
│   ├── routers/             # API routes
│   │   ├── bookings.ts      # Booking endpoints
│   │   ├── vehicles.ts      # Vehicle endpoints
│   │   ├── approvals.ts     # Approval endpoints
│   │   ├── notifications.ts # SSE notifications
│   │   └── index.ts         # Router aggregation
│   │
│   ├── services/            # Business logic
│   │   ├── container.ts     # DI container
│   │   ├── booking.service.ts
│   │   ├── approval.service.ts
│   │   ├── notification.service.ts
│   │   └── vehicle.service.ts
│   │
│   └── middleware/          # Express middleware
│       ├── auth.ts          # Authentication
│       ├── cors.ts          # CORS handling
│       └── rateLimit.ts     # Rate limiting
```

### Frontend Components

```
apps/web/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   ├── login/           # Login page
│   │   └── dashboard/       # Dashboard page
│   │
│   ├── components/          # React components
│   │   ├── ui/              # Base UI components
│   │   ├── CarBookingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── MyBookingsPage.tsx
│   │   ├── HRApprovalPage.tsx
│   │   ├── ManagerApprovalPage.tsx
│   │   └── providers.tsx    # Context providers
│   │
│   ├── lib/                 # Utilities
│   │   ├── auth-client.ts   # Auth client
│   │   └── utils.ts         # Helper functions
│   │
│   ├── utils/               # API utilities
│   │   └── trpc.ts          # tRPC client setup
│   │
│   └── types/               # TypeScript types
│       └── index.ts         # Shared types
```

## Data Flow

### 1. Booking Creation Flow
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant tRPC
    participant BookingService
    participant Database
    participant NotificationService
    
    User->>Frontend: Submit booking form
    Frontend->>tRPC: bookings.create mutation
    tRPC->>BookingService: createBooking(data)
    BookingService->>Database: Check conflicts
    BookingService->>Database: Insert booking
    BookingService->>NotificationService: Send notification
    BookingService-->>tRPC: Return booking
    tRPC-->>Frontend: Booking created
    Frontend-->>User: Show confirmation
```

### 2. Approval Workflow
```mermaid
stateDiagram-v2
    [*] --> Pending: Booking Created
    Pending --> ManagerReview: Awaiting Manager
    ManagerReview --> ManagerApproved: Manager Approves
    ManagerReview --> Rejected: Manager Rejects
    ManagerApproved --> HRReview: Awaiting HR
    HRReview --> Approved: HR Approves
    HRReview --> Rejected: HR Rejects
    Approved --> [*]
    Rejected --> [*]
```

## Security Architecture

### Authentication & Authorization

#### Authentication Flow
```typescript
// Better Auth configuration
export const auth = betterAuth({
  database: drizzle(pool, { schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,
  },
  session: {
    cookieName: "car-booking-session",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});
```

#### Role-Based Access Control
```typescript
enum UserRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  HR = 'hr',
  ADMIN = 'admin'
}

// Middleware enforcement
const requireRole = (role: UserRole) => {
  return async (ctx: Context) => {
    if (ctx.user.role !== role) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
  };
};
```

### Security Measures

1. **Input Validation**: All inputs validated with Zod schemas
2. **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
3. **XSS Protection**: React's automatic escaping + CSP headers
4. **CSRF Protection**: SameSite cookies + token validation
5. **Rate Limiting**: Tiered limits based on user roles
6. **Session Security**: Secure, HttpOnly, SameSite cookies

### Rate Limiting Strategy
```typescript
const rateLimits = {
  anonymous: { windowMs: 60000, max: 10 },
  authenticated: { windowMs: 60000, max: 100 },
  manager: { windowMs: 60000, max: 200 },
  admin: { windowMs: 60000, max: 500 }
};
```

## Database Design

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Vehicles Table
```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  license_plate VARCHAR(50) UNIQUE NOT NULL,
  seats INTEGER NOT NULL,
  status vehicle_status DEFAULT 'available',
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Bookings Table
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  vehicle_id UUID REFERENCES vehicles(id),
  booking_period tsrange NOT NULL,
  destination TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status booking_status DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  EXCLUDE USING gist (vehicle_id WITH =, booking_period WITH &&)
);
```

### Indexes
```sql
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_period ON bookings USING gist(booking_period);
CREATE INDEX idx_approvals_booking_id ON approvals(booking_id);
```

## API Design

### tRPC Router Structure
```typescript
export const appRouter = router({
  // Authentication
  auth: authRouter,
  
  // Bookings
  bookings: router({
    create: protectedProcedure
      .input(createBookingSchema)
      .mutation(async ({ input, ctx }) => {
        return container.bookingService.create(input, ctx.user);
      }),
    list: protectedProcedure
      .input(listBookingsSchema)
      .query(async ({ input, ctx }) => {
        return container.bookingService.list(input, ctx.user);
      }),
  }),
  
  // Vehicles
  vehicles: router({
    list: publicProcedure.query(async () => {
      return container.vehicleService.list();
    }),
    checkAvailability: protectedProcedure
      .input(checkAvailabilitySchema)
      .query(async ({ input }) => {
        return container.vehicleService.checkAvailability(input);
      }),
  }),
  
  // Approvals
  approvals: router({
    approve: managerProcedure
      .input(approvalSchema)
      .mutation(async ({ input, ctx }) => {
        return container.approvalService.approve(input, ctx.user);
      }),
  }),
  
  // Notifications (SSE)
  notifications: router({
    subscribe: protectedProcedure
      .subscription(async function* ({ ctx }) {
        yield* container.notificationService.subscribe(ctx.user.id);
      }),
  }),
});
```

### API Conventions
- RESTful naming for CRUD operations
- Consistent error responses with error codes
- Pagination for list endpoints
- Filtering and sorting capabilities
- Optimistic updates for better UX

## Deployment Architecture

### Development Environment
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: car_booking
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7
    ports:
      - "6379:6379"
  
  app:
    build: .
    environment:
      DATABASE_URL: postgresql://admin:password@postgres:5432/car_booking
      REDIS_URL: redis://redis:6379
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
```

### Production Architecture
```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile App]
    end
    
    subgraph "CDN Layer"
        CloudFlare[CloudFlare CDN]
    end
    
    subgraph "Application Layer"
        LB[Load Balancer]
        App1[Next.js App 1]
        App2[Next.js App 2]
        App3[Next.js App 3]
    end
    
    subgraph "Cache Layer"
        Redis[(Redis Cluster)]
    end
    
    subgraph "Database Layer"
        PG_Primary[(PostgreSQL Primary)]
        PG_Replica1[(PostgreSQL Replica 1)]
        PG_Replica2[(PostgreSQL Replica 2)]
    end
    
    Browser --> CloudFlare
    Mobile --> CloudFlare
    CloudFlare --> LB
    LB --> App1
    LB --> App2
    LB --> App3
    App1 --> Redis
    App2 --> Redis
    App3 --> Redis
    App1 --> PG_Primary
    App2 --> PG_Primary
    App3 --> PG_Primary
    PG_Primary --> PG_Replica1
    PG_Primary --> PG_Replica2
```

### Environment Variables
```bash
# Production environment
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db.example.com:5432/car_booking
REDIS_URL=redis://redis.example.com:6379
BETTER_AUTH_SECRET=<generated-secret>
BETTER_AUTH_URL=https://app.example.com
NEXT_PUBLIC_APP_URL=https://app.example.com
CORS_ORIGIN=https://app.example.com
```

## Performance Considerations

### Database Optimization
1. **Connection Pooling**: PgBouncer for connection management
2. **Query Optimization**: Proper indexing and query analysis
3. **Caching Strategy**: Redis for frequently accessed data
4. **Read Replicas**: Separate read queries from writes

### Frontend Optimization
1. **Code Splitting**: Dynamic imports for large components
2. **Image Optimization**: Next.js Image component with lazy loading
3. **Bundle Size**: Tree shaking and minification
4. **Caching**: SWR/React Query for client-side caching

### API Optimization
1. **Response Compression**: Gzip/Brotli compression
2. **Pagination**: Limit result sets to prevent large payloads
3. **Field Selection**: GraphQL-like field selection in tRPC
4. **Request Batching**: tRPC batch link for multiple queries

### Monitoring & Observability
```typescript
// OpenTelemetry integration
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('car-booking-system');

export async function tracedOperation(name: string, fn: Function) {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      return await fn();
    } finally {
      span.end();
    }
  });
}
```

## Scalability Strategy

### Horizontal Scaling
1. **Stateless Architecture**: No server-side session storage
2. **Load Balancing**: Round-robin with health checks
3. **Auto-scaling**: Based on CPU/memory metrics
4. **Database Sharding**: By organization/tenant

### Vertical Scaling
1. **Database**: Upgrade to larger instances as needed
2. **Cache Layer**: Increase Redis memory allocation
3. **Application Servers**: Increase CPU/RAM as needed

### Future Microservices Architecture
```mermaid
graph LR
    Gateway[API Gateway]
    Auth[Auth Service]
    Booking[Booking Service]
    Vehicle[Vehicle Service]
    Notification[Notification Service]
    Approval[Approval Service]
    
    Gateway --> Auth
    Gateway --> Booking
    Gateway --> Vehicle
    Gateway --> Notification
    Gateway --> Approval
    
    Booking --> Notification
    Approval --> Notification
```

## Development Guidelines

### Code Standards
1. **TypeScript**: Strict mode enabled
2. **Linting**: ESLint with recommended rules
3. **Formatting**: Prettier with consistent style
4. **Testing**: Jest for unit tests, Playwright for E2E
5. **Git Hooks**: Husky for pre-commit validation

### Git Workflow
```bash
# Feature branch workflow
main
├── develop
│   ├── feature/booking-improvements
│   ├── feature/notification-system
│   └── bugfix/approval-workflow
└── release/v1.0.0
```

### Testing Strategy
```typescript
// Unit test example
describe('BookingService', () => {
  it('should prevent double booking', async () => {
    const booking1 = await service.create(bookingData);
    await expect(service.create(bookingData)).rejects.toThrow('Conflict');
  });
});

// Integration test example
describe('Booking API', () => {
  it('should create booking with approval workflow', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .send(bookingData);
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('pending');
  });
});
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npm run deploy
```

## Conclusion

The Car Booking System architecture provides a solid foundation for a scalable, maintainable, and secure application. The use of modern technologies like Next.js, tRPC, and PostgreSQL ensures type safety and developer productivity. The service-oriented architecture with dependency injection enables easy testing and future microservices migration.

### Key Architectural Decisions
1. **Monorepo Structure**: Simplified development and deployment
2. **Type-Safe APIs**: Reduced runtime errors with tRPC
3. **Service Layer**: Centralized business logic
4. **PostgreSQL**: Robust relational database with advanced features
5. **Server-Side Rendering**: Better SEO and initial load performance

### Future Enhancements
1. Implement event sourcing for audit trails
2. Add GraphQL for flexible client queries
3. Implement WebSocket for real-time updates
4. Add machine learning for demand prediction
5. Implement blockchain for tamper-proof booking records

---

*Document Version: 1.0.0*  
*Last Updated: December 2024*  
*Maintained by: Development Team*