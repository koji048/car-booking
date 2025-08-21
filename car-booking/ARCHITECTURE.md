# Car Booking System - Architecture Documentation

## Project Structure Overview

This project follows a **monorepo architecture** using Turborepo with npm workspaces, organizing the codebase into distinct applications and shared packages for maximum code reuse and maintainability.

## Directory Structure

```
car-booking/
├── apps/                    # Application packages
│   ├── web/                # Next.js web application
│   │   ├── public/         # Static assets
│   │   ├── src/           # Source code
│   │   │   ├── app/       # Next.js app router pages
│   │   │   ├── components/# React components
│   │   │   ├── hooks/     # Custom React hooks
│   │   │   ├── lib/       # Utilities and libraries
│   │   │   └── utils/     # Utility functions
│   │   └── package.json
│   │
│   ├── server/             # API server with tRPC
│   │   ├── src/           # Source code
│   │   │   ├── app/       # Next.js API routes
│   │   │   ├── db/        # Database layer
│   │   │   │   ├── schema/    # Database schemas
│   │   │   │   └── migrations/# Database migrations
│   │   │   ├── lib/       # Server utilities
│   │   │   │   ├── validations/  # Input validations
│   │   │   │   └── middleware/   # Server middleware
│   │   │   ├── routers/   # tRPC routers
│   │   │   └── services/  # Business logic services
│   │   └── package.json
│   │
│   └── native/             # React Native mobile app
│       ├── app/           # Expo Router screens
│       ├── assets/        # Mobile assets
│       ├── components/    # React Native components
│       ├── lib/           # Mobile utilities
│       └── package.json
│
├── packages/               # Shared packages
│   ├── ui/                # Shared UI components library
│   │   ├── src/
│   │   │   ├── components/   # Reusable UI components
│   │   │   └── lib/          # UI utilities
│   │   └── package.json
│   │
│   ├── types/             # Shared TypeScript type definitions
│   │   ├── src/
│   │   │   └── index.ts     # Centralized type exports
│   │   └── package.json
│   │
│   └── utils/             # Shared utility functions
│       ├── src/
│       │   ├── datetime.ts  # Date/time utilities
│       │   └── index.ts     # Utility exports
│       └── package.json
│
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md    # This file
│   ├── README.md          # Project overview
│   ├── BACKEND_SETUP.md   # Backend setup guide
│   ├── LDAP_SETUP.md      # LDAP configuration
│   └── ...                # Other documentation
│
├── scripts/               # Build and utility scripts
│   ├── check-secrets.sh   # Security checks
│   ├── pre-push-check.sh  # Pre-push validation
│   └── update-imports.sh  # Import migration scripts
│
├── turbo.json            # Turborepo configuration
├── package.json          # Root package configuration
└── tsconfig.json         # Root TypeScript configuration
```

## Architecture Principles

### 1. Separation of Concerns
- **Apps**: Self-contained applications with their specific business logic
- **Packages**: Shared, reusable code across applications
- **Clear boundaries**: Each module has a well-defined responsibility

### 2. Monorepo Benefits
- **Code Sharing**: Common components, types, and utilities are shared
- **Atomic Changes**: Related changes across packages can be committed together
- **Consistent Tooling**: Single set of development tools and configurations
- **Simplified Dependencies**: Internal packages are automatically linked

### 3. Technology Stack

#### Frontend (Web)
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Components**: Radix UI primitives with custom styling
- **State Management**: React Query (TanStack Query)
- **API Client**: tRPC client

#### Backend (Server)
- **Framework**: Next.js API Routes
- **API Layer**: tRPC for type-safe APIs
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with LDAP/Microsoft 365 SSO
- **Validation**: Zod schemas

#### Mobile (Native)
- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind for React Native)
- **API Client**: tRPC client

#### Shared Packages
- **UI Components**: Radix UI based component library
- **Types**: Centralized TypeScript definitions
- **Utils**: Common utility functions (date/time, formatting, etc.)

## Data Flow Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Web Client    │────▶│   tRPC Server   │────▶│   PostgreSQL    │
│   (Next.js)     │◀────│   (API Layer)   │◀────│    Database     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Shared Types   │     │    Services     │     │   Drizzle ORM   │
│   (@car-booking │     │  (Business      │     │    (Schema      │
│     /types)     │     │    Logic)       │     │   Definition)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Key Design Patterns

### 1. Service Layer Pattern
Business logic is encapsulated in service classes:
- `BookingService`: Handles booking operations
- `VehicleService`: Manages vehicle inventory
- `ApprovalService`: Manages approval workflows
- `NotificationService`: Handles notifications

### 2. Repository Pattern (via Drizzle ORM)
Database operations are abstracted through Drizzle ORM schemas:
- Type-safe queries
- Migration management
- Schema validation

### 3. Validation Layer
All inputs are validated using Zod schemas:
- Request validation at API boundaries
- Type inference from schemas
- Consistent error handling

### 4. Middleware Architecture
Server-side concerns are handled via middleware:
- Authentication checks
- Rate limiting
- Request logging
- Error handling

## Module Guidelines

### Creating New Features

1. **Define Types** in `packages/types`:
   ```typescript
   // packages/types/src/index.ts
   export interface NewFeature {
     id: string;
     // ... properties
   }
   ```

2. **Create UI Components** in `packages/ui` (if reusable):
   ```typescript
   // packages/ui/src/components/new-component.tsx
   export function NewComponent() {
     // Component implementation
   }
   ```

3. **Implement Business Logic** in `apps/server/src/services`:
   ```typescript
   // apps/server/src/services/new-feature.service.ts
   export class NewFeatureService {
     // Service implementation
   }
   ```

4. **Create API Routes** in `apps/server/src/routers`:
   ```typescript
   // apps/server/src/routers/new-feature.router.ts
   export const newFeatureRouter = router({
     // Router implementation
   });
   ```

5. **Build UI Pages** in `apps/web/src/app`:
   ```typescript
   // apps/web/src/app/new-feature/page.tsx
   export default function NewFeaturePage() {
     // Page implementation
   }
   ```

### File Naming Conventions

- **Components**: PascalCase (e.g., `CarBookingPage.tsx`)
- **Utilities**: camelCase (e.g., `datetime.ts`)
- **Types**: PascalCase for interfaces/types
- **Services**: PascalCase with `.service.ts` suffix
- **Routers**: camelCase with `.router.ts` suffix
- **Schemas**: camelCase with `.ts` in schema directory

### Import Guidelines

#### For Web/Native Apps:
```typescript
// Import from shared packages
import { Button, Card } from '@car-booking/ui';
import { User, BookingData } from '@car-booking/types';
import { formatDate, cn } from '@car-booking/utils';

// Import from local modules
import { MyComponent } from '@/components/MyComponent';
import { useAuth } from '@/hooks/useAuth';
```

#### For Server App:
```typescript
// Import from shared packages
import { BookingData } from '@car-booking/types';
import { validateBookingDateTime } from '@car-booking/utils';

// Import from local modules
import { BookingService } from '@/services/booking.service';
import { db } from '@/db';
```

## Development Workflow

### Running the Applications

```bash
# Run all applications
npm run dev

# Run specific application
npm run dev:web    # Web application
npm run dev:server # API server
npm run dev:native # Mobile app
```

### Building for Production

```bash
# Build all applications
npm run build

# Type checking
npm run check-types
```

### Database Management

```bash
# Push schema changes to database
npm run db:push

# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Open database studio
npm run db:studio
```

## Security Considerations

1. **Authentication**: Multi-provider support (LDAP, Microsoft 365 SSO)
2. **Authorization**: Role-based access control (Employee, Manager, HR, Admin)
3. **Input Validation**: All inputs validated with Zod schemas
4. **Rate Limiting**: API endpoints protected against abuse
5. **Secret Management**: Environment variables for sensitive data
6. **Security Scanning**: Pre-push hooks for security checks

## Performance Optimizations

1. **Code Splitting**: Automatic with Next.js app router
2. **Lazy Loading**: Components loaded on demand
3. **API Caching**: React Query for client-side caching
4. **Database Indexing**: Optimized queries with proper indexes
5. **Bundle Optimization**: Turbopack for faster builds

## Deployment Architecture

The application can be deployed in various configurations:

1. **Vercel/Netlify**: Web application
2. **Railway/Render**: API server and database
3. **Expo EAS**: Mobile application
4. **Docker**: Containerized deployment

## Monitoring and Observability

- **Error Tracking**: Integration points for Sentry/Rollbar
- **Performance Monitoring**: Web vitals tracking
- **API Monitoring**: Request/response logging
- **Database Monitoring**: Query performance tracking

## Future Enhancements

1. **Microservices Migration**: Services can be extracted to separate deployments
2. **GraphQL Gateway**: Alternative API layer for flexible queries
3. **Event-Driven Architecture**: Message queue for async operations
4. **Multi-tenancy**: Support for multiple organizations
5. **Offline Support**: PWA capabilities for web, offline-first for mobile

## Contributing

When contributing to this project:

1. Follow the established directory structure
2. Place shared code in appropriate packages
3. Maintain type safety throughout
4. Write tests for business logic
5. Update documentation for significant changes
6. Use conventional commits for clear history

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Expo Documentation](https://docs.expo.dev/)