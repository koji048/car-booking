# Backend Architecture Document
## Car Booking System

### 1. Executive Summary

This document outlines the backend architecture for a corporate car booking system designed to serve less than 100 users with a two-tier approval workflow (Employee → Manager → HR). The system emphasizes reliability, maintainability, and user experience over complex scaling solutions.

**Key Business Requirements:**
- Two-tier approval workflow
- No double-booking allowed
- Email and in-app notifications
- Basic reporting and booking history
- Support for multiple drivers and companions per booking

**Technology Stack:**
- **Runtime:** Node.js with Next.js
- **API Layer:** tRPC for type-safe APIs
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Better Auth
- **Real-time:** Server-Sent Events (SSE) for notifications
- **Email Service:** Resend/SendGrid for transactional emails
- **Deployment:** Vercel/Railway for simplicity

---

### 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
├─────────────────┬───────────────────┬───────────────────────┤
│   Web App       │   Mobile App      │   Admin Dashboard     │
│   (Next.js)     │   (React Native)  │   (Next.js)          │
└────────┬────────┴─────────┬─────────┴───────────┬───────────┘
         │                  │                     │
         └──────────────────┼─────────────────────┘
                           │
                    [HTTPS/WSS]
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                      API GATEWAY                             │
│                   (Next.js API Routes)                       │
├──────────────────────────────────────────────────────────────┤
│  • Rate Limiting (100 req/min per user)                      │
│  • Request Validation                                        │
│  • CORS Management                                           │
│  • Request Logging                                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                     APPLICATION LAYER                        │
├─────────────────┬────────────────┬──────────────────────────┤
│   tRPC Router   │  Auth Service  │   WebSocket/SSE         │
│   • Bookings    │  (Better Auth) │   • Notifications       │
│   • Vehicles    │  • JWT/Session │   • Status Updates      │
│   • Approvals   │  • Permissions │                         │
│   • Reports     │                │                         │
└─────────┬───────┴────────┬───────┴────────┬─────────────────┘
          │                │                │
┌─────────┴────────────────┴────────────────┴─────────────────┐
│                     BUSINESS LOGIC LAYER                     │
├───────────────┬─────────────────┬───────────────────────────┤
│  Booking      │  Approval       │  Notification             │
│  Service      │  Workflow       │  Service                  │
│  • Validation │  • State Machine│  • Email Queue            │
│  • Conflicts  │  • Escalation   │  • In-App Push            │
│  • Scheduling │  • History      │  • Template Engine        │
└───────┬───────┴─────────┬───────┴───────────┬───────────────┘
        │                 │                   │
┌───────┴─────────────────┴───────────────────┴───────────────┐
│                      DATA ACCESS LAYER                       │
│                        (Drizzle ORM)                         │
├───────────────────────────────────────────────────────────────┤
│  • Connection Pooling (max: 20)                              │
│  • Query Builder                                             │
│  • Migrations Management                                     │
│  • Transaction Support                                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                    PostgreSQL DATABASE                       │
├───────────────────────────────────────────────────────────────┤
│  Tables: users, vehicles, bookings, approvals,              │
│          notifications, audit_logs                          │
└───────────────────────────────────────────────────────────────┘
```

---

### 3. Database Schema Design

```sql
-- Core Tables

-- Users (Extended from Better Auth)
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('employee', 'manager', 'hr', 'admin'),
  department_id UUID,
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
)

-- Vehicles
vehicles (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  seats INTEGER NOT NULL,
  license_plate VARCHAR(50) UNIQUE NOT NULL,
  status ENUM('available', 'booked', 'maintenance'),
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Bookings
bookings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  vehicle_id UUID REFERENCES vehicles(id),
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  return_date DATE,
  return_time TIME,
  destination TEXT NOT NULL,
  reason VARCHAR(500),
  booking_type VARCHAR(50),
  status ENUM('draft', 'pending_manager', 'pending_hr', 'approved', 'rejected', 'cancelled'),
  number_of_drivers INTEGER DEFAULT 1,
  number_of_companions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Booking Travelers
booking_travelers (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  name VARCHAR(255) NOT NULL,
  type ENUM('driver', 'companion'),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Approvals
approvals (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  approver_id UUID REFERENCES users(id),
  approval_level ENUM('manager', 'hr'),
  status ENUM('pending', 'approved', 'rejected'),
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Notifications
notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  booking_id UUID REFERENCES bookings(id),
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Audit Logs
audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Indexes for Performance
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_vehicle_date ON bookings(vehicle_id, departure_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_approvals_booking ON approvals(booking_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
```

---

### 4. API Design (tRPC Routers)

```typescript
// Router Structure
export const appRouter = router({
  // Authentication
  auth: authRouter,
  
  // Bookings
  bookings: router({
    create: protectedProcedure
      .input(createBookingSchema)
      .mutation(/* conflict checking, create booking */),
    
    list: protectedProcedure
      .input(listBookingsSchema)
      .query(/* paginated list with filters */),
    
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(/* get single booking with details */),
    
    update: protectedProcedure
      .input(updateBookingSchema)
      .mutation(/* update if allowed by status */),
    
    cancel: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(/* cancel booking, notify approvers */),
    
    checkConflicts: protectedProcedure
      .input(conflictCheckSchema)
      .query(/* check vehicle availability */)
  }),
  
  // Vehicles
  vehicles: router({
    list: publicProcedure.query(/* list all vehicles */),
    
    availability: protectedProcedure
      .input(availabilitySchema)
      .query(/* check availability for date range */),
    
    maintenance: adminProcedure
      .input(maintenanceSchema)
      .mutation(/* set maintenance mode */)
  }),
  
  // Approvals
  approvals: router({
    pending: protectedProcedure
      .query(/* get pending approvals for user */),
    
    approve: protectedProcedure
      .input(approvalSchema)
      .mutation(/* approve and move to next level */),
    
    reject: protectedProcedure
      .input(rejectionSchema)
      .mutation(/* reject with reason */),
    
    history: protectedProcedure
      .input(paginationSchema)
      .query(/* approval history */)
  }),
  
  // Notifications
  notifications: router({
    list: protectedProcedure
      .query(/* get user notifications */),
    
    markRead: protectedProcedure
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(/* mark as read */),
    
    subscribe: protectedProcedure
      .subscription(/* SSE subscription for real-time */)
  }),
  
  // Reports
  reports: router({
    bookingHistory: protectedProcedure
      .input(dateRangeSchema)
      .query(/* booking history report */),
    
    vehicleUtilization: adminProcedure
      .input(dateRangeSchema)
      .query(/* vehicle usage statistics */),
    
    export: protectedProcedure
      .input(exportSchema)
      .mutation(/* generate CSV/PDF export */)
  })
});
```

---

### 5. Core Services Implementation

#### 5.1 Booking Service

```typescript
class BookingService {
  async createBooking(data: CreateBookingInput, userId: string) {
    // 1. Validate user permissions
    const user = await this.validateUser(userId);
    
    // 2. Check vehicle availability (no double booking)
    const conflicts = await this.checkConflicts({
      vehicleId: data.vehicleId,
      startTime: data.departureDateTime,
      endTime: data.returnDateTime
    });
    
    if (conflicts.length > 0) {
      throw new ConflictError('Vehicle already booked');
    }
    
    // 3. Create booking with transaction
    const booking = await db.transaction(async (tx) => {
      // Create booking
      const booking = await tx.insert(bookings).values({
        ...data,
        userId,
        status: 'pending_manager'
      });
      
      // Add travelers
      await this.addTravelers(tx, booking.id, data.travelers);
      
      // Create approval request
      await this.createApprovalRequest(tx, booking.id, user.managerId);
      
      // Send notifications
      await this.notifyManager(booking.id, user.managerId);
      
      return booking;
    });
    
    // 4. Trigger async operations
    await this.sendEmailNotification(booking);
    
    return booking;
  }
  
  async checkConflicts(params: ConflictCheckParams): Promise<Booking[]> {
    return db.query.bookings.findMany({
      where: and(
        eq(bookings.vehicleId, params.vehicleId),
        or(
          // Check overlap with existing bookings
          and(
            lte(bookings.departureDateTime, params.startTime),
            gte(bookings.returnDateTime, params.startTime)
          ),
          and(
            lte(bookings.departureDateTime, params.endTime),
            gte(bookings.returnDateTime, params.endTime)
          )
        ),
        inArray(bookings.status, ['approved', 'pending_manager', 'pending_hr'])
      )
    });
  }
}
```

#### 5.2 Approval Workflow Engine

```typescript
class ApprovalWorkflow {
  private readonly workflow = {
    'pending_manager': {
      next: 'pending_hr',
      role: 'manager',
      notification: 'booking_approved_by_manager'
    },
    'pending_hr': {
      next: 'approved',
      role: 'hr',
      notification: 'booking_approved_by_hr'
    }
  };
  
  async processApproval(
    bookingId: string, 
    approverId: string, 
    decision: 'approve' | 'reject',
    comments?: string
  ) {
    const booking = await this.getBooking(bookingId);
    const approver = await this.validateApprover(approverId, booking.status);
    
    await db.transaction(async (tx) => {
      // Record approval
      await tx.insert(approvals).values({
        bookingId,
        approverId,
        status: decision,
        comments,
        approvalLevel: this.workflow[booking.status].role
      });
      
      if (decision === 'approve') {
        // Move to next level
        const nextStatus = this.workflow[booking.status].next;
        await tx.update(bookings)
          .set({ status: nextStatus })
          .where(eq(bookings.id, bookingId));
        
        // Notify next approver or requester
        if (nextStatus === 'approved') {
          await this.notifyApproved(bookingId);
        } else {
          await this.notifyNextApprover(bookingId, nextStatus);
        }
      } else {
        // Reject booking
        await tx.update(bookings)
          .set({ status: 'rejected' })
          .where(eq(bookings.id, bookingId));
        
        await this.notifyRejected(bookingId, comments);
      }
    });
  }
}
```

#### 5.3 Notification Service

```typescript
class NotificationService {
  private emailQueue: Queue;
  private sseConnections: Map<string, Response>;
  
  async sendNotification(params: NotificationParams) {
    // 1. Store in database
    const notification = await db.insert(notifications).values({
      userId: params.userId,
      bookingId: params.bookingId,
      type: params.type,
      title: params.title,
      message: params.message
    });
    
    // 2. Send real-time notification
    this.sendSSE(params.userId, notification);
    
    // 3. Queue email notification
    await this.emailQueue.add({
      to: params.userEmail,
      subject: params.title,
      template: params.emailTemplate,
      data: params.templateData
    });
  }
  
  sendSSE(userId: string, data: any) {
    const connection = this.sseConnections.get(userId);
    if (connection) {
      connection.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }
  
  async processEmailQueue() {
    // Process emails with retry logic
    this.emailQueue.process(async (job) => {
      const { to, subject, template, data } = job.data;
      
      try {
        await this.emailProvider.send({
          to,
          subject,
          html: await this.renderTemplate(template, data)
        });
        
        await db.update(notifications)
          .set({ emailSent: true })
          .where(eq(notifications.id, data.notificationId));
      } catch (error) {
        throw error; // Will retry based on queue config
      }
    });
  }
}
```

---

### 6. Security & Authentication

#### 6.1 Authentication Flow
```typescript
// Using Better Auth with extensions
export const auth = betterAuth({
  database: drizzleAdapter(db, { schema }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false // For internal system
  },
  
  session: {
    expiresIn: 60 * 60 * 8, // 8 hours
    updateAge: 60 * 60 * 2  // Update every 2 hours
  },
  
  rateLimit: {
    window: 60, // 1 minute
    max: 10     // 10 attempts per minute
  }
});

// Role-based middleware
export const protectedProcedure = t.procedure
  .use(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({ ctx: { ...ctx, user: ctx.session.user } });
  });

export const managerProcedure = protectedProcedure
  .use(async ({ ctx, next }) => {
    if (!['manager', 'hr', 'admin'].includes(ctx.user.role)) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next();
  });
```

#### 6.2 Security Best Practices
- **Input Validation:** Zod schemas for all inputs
- **SQL Injection:** Parameterized queries via Drizzle ORM
- **XSS Prevention:** Input sanitization, CSP headers
- **CSRF Protection:** Token validation on state-changing operations
- **Rate Limiting:** Per-user limits on API endpoints
- **Audit Logging:** All critical operations logged
- **Data Encryption:** Sensitive data encrypted at rest

---

### 7. Performance Optimization

#### 7.1 Database Optimization
```typescript
// Connection pooling configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,              // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Query optimization examples
class BookingRepository {
  // Use indexed queries
  async getActiveBookings(vehicleId: string, date: Date) {
    return db.query.bookings.findMany({
      where: and(
        eq(bookings.vehicleId, vehicleId),
        eq(bookings.departureDate, date),
        inArray(bookings.status, ['approved', 'pending_manager', 'pending_hr'])
      ),
      with: {
        travelers: true,
        vehicle: true
      }
    });
  }
  
  // Batch operations
  async batchUpdateNotifications(ids: string[]) {
    return db.update(notifications)
      .set({ isRead: true })
      .where(inArray(notifications.id, ids));
  }
}
```

#### 7.2 Caching Strategy
```typescript
// In-memory cache for frequently accessed data
class CacheService {
  private cache = new Map();
  private ttl = 5 * 60 * 1000; // 5 minutes
  
  async getVehicles(): Promise<Vehicle[]> {
    const cached = this.cache.get('vehicles');
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    
    const vehicles = await db.query.vehicles.findMany();
    this.cache.set('vehicles', {
      data: vehicles,
      expires: Date.now() + this.ttl
    });
    
    return vehicles;
  }
  
  invalidate(key: string) {
    this.cache.delete(key);
  }
}
```

---

### 8. Error Handling & Monitoring

#### 8.1 Error Handling
```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

// Global error handler
export const errorHandler = (error: any, ctx: Context) => {
  if (error instanceof AppError && error.isOperational) {
    return {
      error: {
        message: error.message,
        statusCode: error.statusCode
      }
    };
  }
  
  // Log unexpected errors
  logger.error('Unexpected error:', error);
  
  // Send generic error to client
  return {
    error: {
      message: 'Internal server error',
      statusCode: 500
    }
  };
};
```

#### 8.2 Logging & Monitoring
```typescript
// Structured logging
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Request logging middleware
export const requestLogger = async (req: Request, res: Response, next: Next) => {
  const start = Date.now();
  
  await next();
  
  logger.info({
    method: req.method,
    url: req.url,
    status: res.status,
    duration: Date.now() - start,
    userId: req.session?.userId
  });
};
```

---

### 9. Deployment Architecture

#### 9.1 Recommended Deployment (Vercel + Supabase)
```yaml
Production Environment:
  Application:
    Platform: Vercel
    Regions: Auto (Edge Functions)
    Environment Variables:
      - DATABASE_URL
      - BETTER_AUTH_SECRET
      - EMAIL_API_KEY
    
  Database:
    Provider: Supabase (PostgreSQL)
    Plan: Pro ($25/month for small team)
    Backups: Daily automated
    
  Email Service:
    Provider: Resend/SendGrid
    Plan: Starter (100 emails/day free)
    
  Monitoring:
    - Vercel Analytics (built-in)
    - Sentry for error tracking (free tier)
```

#### 9.2 Environment Configuration
```env
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/carbooking
BETTER_AUTH_SECRET=random-32-char-string
BETTER_AUTH_URL=https://yourdomain.com
EMAIL_API_KEY=your-email-service-key
CORS_ORIGIN=https://yourdomain.com
```

---

### 10. Development Workflow

#### 10.1 Local Development Setup
```bash
# Install dependencies
npm install

# Setup database
npm run db:push     # Push schema to database
npm run db:seed     # Seed test data

# Run development servers
npm run dev         # Start all services
```

#### 10.2 Testing Strategy
```typescript
// Unit tests for business logic
describe('BookingService', () => {
  test('should prevent double booking', async () => {
    const booking1 = await bookingService.create({...});
    
    await expect(
      bookingService.create({
        vehicleId: booking1.vehicleId,
        departureDate: booking1.departureDate,
        departureTime: booking1.departureTime
      })
    ).rejects.toThrow('Vehicle already booked');
  });
});

// Integration tests for API
describe('Booking API', () => {
  test('POST /api/bookings', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send(validBookingData);
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('pending_manager');
  });
});
```

---

### 11. Future Enhancements

Based on potential growth, consider these future enhancements:

1. **Mobile Push Notifications**: Add Firebase Cloud Messaging
2. **Calendar Integration**: Sync with Google Calendar/Outlook
3. **Driver License Verification**: OCR scanning and validation
4. **GPS Tracking**: Real-time vehicle location tracking
5. **Cost Allocation**: Department billing and budget tracking
6. **Advanced Analytics**: Usage patterns and predictive booking
7. **Multi-tenancy**: Support for multiple office locations
8. **External Integrations**: HR systems, expense management

---

### 12. Maintenance & Operations

#### 12.1 Database Maintenance
```sql
-- Weekly maintenance tasks
VACUUM ANALYZE bookings;
REINDEX INDEX CONCURRENTLY idx_bookings_vehicle_date;

-- Archive old bookings (monthly)
INSERT INTO bookings_archive 
SELECT * FROM bookings 
WHERE created_at < NOW() - INTERVAL '6 months'
AND status IN ('completed', 'cancelled', 'rejected');
```

#### 12.2 Monitoring Checklist
- [ ] API response times < 200ms (p95)
- [ ] Database connections < 80% of pool
- [ ] Email delivery rate > 95%
- [ ] Error rate < 0.1%
- [ ] Notification delivery within 5 seconds
- [ ] Daily backup verification

---

### 13. API Documentation Examples

#### Create Booking Request
```typescript
POST /api/trpc/bookings.create
{
  "vehicleId": "uuid",
  "departureDate": "2024-12-20",
  "departureTime": "09:00",
  "returnDate": "2024-12-20",
  "returnTime": "17:00",
  "destination": "Client Office - Bangkok",
  "reason": "client-meeting",
  "reasonDetails": "Quarterly review with ABC Corp",
  "numberOfDrivers": 1,
  "numberOfCompanions": 2,
  "travelers": [
    { "name": "John Doe", "type": "driver", "isPrimary": true },
    { "name": "Jane Smith", "type": "companion" },
    { "name": "Bob Johnson", "type": "companion" }
  ]
}
```

#### Approval Response
```typescript
POST /api/trpc/approvals.approve
{
  "bookingId": "uuid",
  "comments": "Approved for client meeting"
}

Response:
{
  "success": true,
  "booking": {
    "id": "uuid",
    "status": "pending_hr",
    "nextApprover": {
      "id": "uuid",
      "name": "HR Manager",
      "email": "hr@company.com"
    }
  }
}
```

---

### 14. Conclusion

This backend architecture provides a solid foundation for your car booking system with:
- **Scalability**: Can handle your current load with room to grow
- **Maintainability**: Clean separation of concerns and modular design
- **Reliability**: Proper error handling and transaction management
- **Security**: Authentication, authorization, and audit trails
- **User Experience**: Real-time updates and email notifications

The architecture is designed to be implemented incrementally, starting with core booking functionality and gradually adding advanced features as needed.