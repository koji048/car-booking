# Car Booking System - Project Structure

## Final Restructured Directory Tree

```
car-booking/
├── apps/                           # Application packages
│   ├── web/                       # Next.js web application
│   │   ├── public/                # Static assets
│   │   │   └── gs-logo.png
│   │   ├── src/
│   │   │   ├── app/              # Next.js App Router pages
│   │   │   │   ├── auth/
│   │   │   │   ├── auth-test/
│   │   │   │   ├── booking/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── demo/
│   │   │   │   ├── ldap-test/
│   │   │   │   ├── login/
│   │   │   │   ├── simple/
│   │   │   │   ├── test/
│   │   │   │   ├── test-login/
│   │   │   │   ├── favicon.ico
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── components/       # React components
│   │   │   │   ├── figma/
│   │   │   │   ├── AdminPage.tsx
│   │   │   │   ├── ApprovalWorkflow.tsx
│   │   │   │   ├── CarBookingPage.tsx
│   │   │   │   ├── GoogleFlightsDatePicker.tsx
│   │   │   │   ├── HRApprovalPage.tsx
│   │   │   │   ├── LocationPicker.tsx
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── ManagerApprovalPage.tsx
│   │   │   │   ├── MyBookingsPage.tsx
│   │   │   │   ├── header.tsx
│   │   │   │   ├── loader.tsx
│   │   │   │   ├── mode-toggle.tsx
│   │   │   │   ├── providers.tsx
│   │   │   │   ├── sign-in-form.tsx
│   │   │   │   ├── sign-up-form.tsx
│   │   │   │   ├── theme-provider.tsx
│   │   │   │   └── user-menu.tsx
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   │   └── useBookings.ts
│   │   │   ├── lib/              # Libraries and configurations
│   │   │   │   └── auth-client.ts
│   │   │   ├── utils/            # Utility functions
│   │   │   │   └── trpc.ts
│   │   │   └── index.css
│   │   ├── components.json       # shadcn/ui configuration
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   ├── postcss.config.mjs
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   │
│   ├── server/                    # API server with tRPC
│   │   ├── src/
│   │   │   ├── app/              # Next.js API routes
│   │   │   │   ├── api/
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── ldap/
│   │   │   │   │   ├── microsoft/
│   │   │   │   │   └── trpc/
│   │   │   │   ├── trpc/
│   │   │   │   └── route.ts
│   │   │   ├── db/               # Database layer
│   │   │   │   ├── migrations/
│   │   │   │   ├── schema/
│   │   │   │   │   ├── auth.ts
│   │   │   │   │   ├── booking.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── notification.ts
│   │   │   │   │   └── vehicle.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── seed.ts
│   │   │   ├── lib/              # Server libraries
│   │   │   │   ├── middleware/
│   │   │   │   │   └── rate-limit.ts
│   │   │   │   ├── validations/
│   │   │   │   │   ├── approval.ts
│   │   │   │   │   ├── booking.ts
│   │   │   │   │   └── common.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── context.ts
│   │   │   │   ├── ldap-auth.ts
│   │   │   │   ├── ldap-config.ts
│   │   │   │   ├── ldap-mock.ts
│   │   │   │   ├── microsoft-auth.ts
│   │   │   │   └── trpc.ts
│   │   │   ├── routers/          # tRPC routers
│   │   │   │   ├── approval.router.ts
│   │   │   │   ├── booking.router.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── notification.router.ts
│   │   │   │   ├── report.router.ts
│   │   │   │   └── vehicle.router.ts
│   │   │   ├── services/         # Business logic
│   │   │   │   ├── approval.service.ts
│   │   │   │   ├── booking.service.ts
│   │   │   │   ├── notification.service.ts
│   │   │   │   ├── service-container.ts
│   │   │   │   └── vehicle.service.ts
│   │   │   └── middleware.ts
│   │   ├── supabase/
│   │   │   └── config.toml
│   │   ├── drizzle.config.ts
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── native/                    # React Native mobile app
│       ├── app/                   # Expo Router screens
│       │   ├── (drawer)/
│       │   ├── +html.tsx
│       │   ├── +not-found.tsx
│       │   ├── _layout.tsx
│       │   └── modal.tsx
│       ├── assets/                # Mobile assets
│       ├── components/            # React Native components
│       ├── lib/                   # Mobile utilities
│       ├── utils/
│       ├── app.json
│       ├── babel.config.js
│       ├── global.css
│       ├── metro.config.js
│       ├── package.json
│       ├── tailwind.config.js
│       └── tsconfig.json
│
├── packages/                      # Shared packages
│   ├── ui/                       # Shared UI component library
│   │   ├── src/
│   │   │   ├── components/       # All shadcn/ui components
│   │   │   │   ├── accordion.tsx
│   │   │   │   ├── alert-dialog.tsx
│   │   │   │   ├── alert.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── calendar.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── checkbox.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── sheet.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   ├── sonner.tsx
│   │   │   │   ├── switch.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── textarea.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── toggle.tsx
│   │   │   │   ├── tooltip.tsx
│   │   │   │   └── ... (40+ components)
│   │   │   ├── lib/
│   │   │   │   └── utils.ts     # cn() utility for className merging
│   │   │   └── index.ts          # Barrel exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── types/                    # Shared TypeScript definitions
│   │   ├── src/
│   │   │   └── index.ts          # All shared types and interfaces
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── utils/                    # Shared utility functions
│       ├── src/
│       │   ├── datetime.ts       # Date/time manipulation utilities
│       │   └── index.ts          # Utility exports including cn()
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                          # All documentation
│   ├── ARCHITECTURE.md
│   ├── BACKEND_FIXES_SUMMARY.md
│   ├── BACKEND_SETUP.md
│   ├── BACKEND_STATUS.md
│   ├── DATABASE_SETUP.md
│   ├── GSBATTERY_LOGIN_INFO.md
│   ├── LDAP_SETUP.md
│   ├── MICROSOFT_365_SSO_SETUP.md
│   ├── QA_REVIEW_BACKEND.md
│   ├── README.md
│   ├── SECURITY.md
│   ├── SIAMGS_LDAP_SETUP.md
│   ├── backend-architecture.md
│   ├── front-end-spec.md
│   └── guidelines/
│       └── Guidelines.md
│
├── scripts/                       # Build and utility scripts
│   ├── check-secrets.sh          # Security scanning
│   ├── fix-all-imports.js        # Import migration helper
│   ├── fix-imports.js
│   ├── pre-push-check.sh         # Git pre-push hooks
│   └── update-imports.sh
│
├── .gitignore
├── ARCHITECTURE.md               # Main architecture document
├── PROJECT_STRUCTURE.md          # This file
├── bts.jsonc                     # Build tool configuration
├── package-lock.json
├── package.json                  # Root package with workspaces
├── tsconfig.json                 # Root TypeScript configuration
└── turbo.json                    # Turborepo configuration
```

## Key Improvements Made

### 1. **Monorepo Structure**
- Organized into `apps/` for applications and `packages/` for shared code
- Clear separation between web, server, and native applications
- Shared packages for maximum code reuse

### 2. **Shared Packages**
- **@car-booking/ui**: All UI components centralized
- **@car-booking/types**: Shared TypeScript types
- **@car-booking/utils**: Common utility functions

### 3. **Documentation Organization**
- All documentation moved to `docs/` directory
- Clear categorization of setup guides and architecture docs
- Maintained guidelines subdirectory

### 4. **Clean Root Directory**
- Removed duplicate components, types, utils directories
- Only essential configuration files at root
- Clear workspace configuration

### 5. **Improved Import Paths**
- Consistent import patterns across all apps
- Package imports: `@car-booking/ui`, `@car-booking/types`, `@car-booking/utils`
- Local imports: `@/components`, `@/lib`, etc.

### 6. **Scalable Architecture**
- Easy to add new apps (e.g., admin dashboard, analytics)
- Easy to add new shared packages
- Clear boundaries between modules

## Migration Summary

### Files Moved
- ✅ UI components → `packages/ui/src/components/`
- ✅ Type definitions → `packages/types/src/`
- ✅ Utility functions → `packages/utils/src/`
- ✅ Documentation → `docs/`
- ✅ Scripts → `scripts/`

### Files Removed (Duplicates)
- ❌ Root `/components` directory
- ❌ Root `/types` directory
- ❌ Root `/utils` directory
- ❌ Root `/styles` directory
- ❌ Root `/supabase` directory
- ❌ Scattered documentation files

### Import Updates
- ✅ Web app imports updated to use shared packages
- ✅ Server app imports updated to use shared packages
- ✅ Package.json files configured for workspaces

## Benefits of New Structure

1. **Code Reusability**: Components and utilities shared across all apps
2. **Type Safety**: Centralized types ensure consistency
3. **Maintainability**: Clear structure makes finding code easier
4. **Scalability**: Easy to add new features and applications
5. **Team Collaboration**: Clear boundaries and responsibilities
6. **Build Performance**: Turborepo caching and parallel builds
7. **Testing**: Easier to test isolated packages
8. **Documentation**: Centralized and organized documentation

## Next Steps

1. Run `npm install` to install all dependencies
2. Run `npm run dev` to start all applications
3. Verify all imports are working correctly
4. Run type checking with `npm run check-types`
5. Test the applications to ensure functionality