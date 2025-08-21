# 🚀 Step-by-Step Migration Guide: Monorepo → Multi-Repository

## Prerequisites
```bash
# Required tools
- Git 2.30+
- Node.js 18+
- GitHub CLI (gh)
- npm 10+
```

## Step 1: Prepare Package Registry

### Option A: GitHub Packages (Recommended)
```bash
# 1. Create GitHub Personal Access Token
# Go to: Settings → Developer settings → Personal access tokens → Tokens (classic)
# Scopes needed: write:packages, read:packages, delete:packages, repo

# 2. Configure npm for GitHub Packages
echo "@car-booking:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc

# 3. Test authentication
npm whoami --registry=https://npm.pkg.github.com
```

### Option B: NPM Private Registry
```bash
# Create npm organization
npm login
npm org create car-booking
```

## Step 2: Extract Types Package

```bash
# 1. Create new repository
gh repo create car-booking-system/car-booking-types --private

# 2. Clone and prepare
git clone git@github.com:car-booking-system/car-booking-types.git
cd car-booking-types

# 3. Copy types package
cp -r ../car-booking/packages/types/* .

# 4. Update package.json
cat > package.json << 'EOF'
{
  "name": "@car-booking/types",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
EOF

# 5. Add TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# 6. Build and publish
npm install
npm run build
npm publish

# 7. Commit and push
git add .
git commit -m "Initial types package setup"
git push origin main
```

## Step 3: Extract Utils Package

```bash
# 1. Create repository
gh repo create car-booking-system/car-booking-utils --private

# 2. Clone and setup
git clone git@github.com:car-booking-system/car-booking-utils.git
cd car-booking-utils

# 3. Copy utils with dependencies on types
cp -r ../car-booking/packages/utils/* .

# 4. Update package.json to use published types
cat > package.json << 'EOF'
{
  "name": "@car-booking/utils",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "@car-booking/types": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
EOF

# 5. Install, build, and publish
npm install
npm run build
npm publish

# 6. Commit and push
git add .
git commit -m "Initial utils package setup"
git push origin main
```

## Step 4: Extract UI Package

```bash
# 1. Create repository
gh repo create car-booking-system/car-booking-ui --private

# 2. Clone and setup
git clone git@github.com:car-booking-system/car-booking-ui.git
cd car-booking-ui

# 3. Copy UI package
cp -r ../car-booking/packages/ui/* .

# 4. Update for standalone package
cat > package.json << 'EOF'
{
  "name": "@car-booking/ui",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --dts --external react",
    "dev": "tsup src/index.ts --dts --external react --watch",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "@car-booking/types": "^1.0.0",
    "@car-booking/utils": "^1.0.0",
    "lucide-react": "^0.487.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.0.0",
    "@types/react": "^19.0.0"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
EOF

# 5. Build and publish
npm install
npm run build
npm publish

git add .
git commit -m "Initial UI package setup"
git push origin main
```

## Step 5: Extract API Server

```bash
# 1. Create repository
gh repo create car-booking-system/car-booking-api --private

# 2. Clone and setup
git clone git@github.com:car-booking-system/car-booking-api.git
cd car-booking-api

# 3. Copy server application
cp -r ../car-booking/apps/server/* .
cp ../car-booking/.env.example .env.example

# 4. Update package.json
cat > package.json << 'EOF'
{
  "name": "car-booking-api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3005",
    "build": "next build",
    "start": "next start",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  },
  "dependencies": {
    "@car-booking/types": "^1.0.0",
    "@car-booking/utils": "^1.0.0",
    "@trpc/server": "^11.4.2",
    "better-auth": "^1.3.4",
    "drizzle-orm": "^0.44.2",
    "next": "15.3.0",
    "pg": "^8.14.1"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.2",
    "typescript": "^5.0.0"
  }
}
EOF

# 5. Setup environment and install
cp .env.example .env
npm install

# 6. Add CI/CD workflow
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy API
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - run: echo "Deploy to production"
EOF

git add .
git commit -m "Initial API server setup"
git push origin main
```

## Step 6: Extract Web Application

```bash
# 1. Create repository
gh repo create car-booking-system/car-booking-web --private

# 2. Clone and setup
git clone git@github.com:car-booking-system/car-booking-web.git
cd car-booking-web

# 3. Copy web application
cp -r ../car-booking/apps/web/* .

# 4. Update package.json for standalone
cat > package.json << 'EOF'
{
  "name": "car-booking-web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack --port 3001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@car-booking/types": "^1.0.0",
    "@car-booking/ui": "^1.0.0",
    "@car-booking/utils": "^1.0.0",
    "@trpc/client": "^11.4.2",
    "@trpc/react-query": "^11.4.4",
    "next": "15.3.0",
    "react": "^19.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.17"
  }
}
EOF

# 5. Update API endpoint configuration
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3005
NEXT_PUBLIC_APP_URL=http://localhost:3001
EOF

# 6. Install and test
npm install
npm run dev

git add .
git commit -m "Initial web application setup"
git push origin main
```

## Step 7: Setup Development Environment

### Create Development Orchestration

```bash
# Create dev environment repository
gh repo create car-booking-system/car-booking-dev --public

git clone git@github.com:car-booking-system/car-booking-dev.git
cd car-booking-dev

# Create docker-compose for local development
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: car_booking
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: ./car-booking-api
    ports:
      - "3005:3005"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/car_booking
    depends_on:
      - postgres

  web:
    build: ./car-booking-web
    ports:
      - "3001:3001"
    environment:
      NEXT_PUBLIC_API_URL: http://api:3005
    depends_on:
      - api

volumes:
  postgres_data:
EOF

# Create setup script
cat > setup.sh << 'EOF'
#!/bin/bash
echo "🚀 Setting up Car Booking development environment..."

# Clone all repositories
repos=(
  "car-booking-types"
  "car-booking-utils"
  "car-booking-ui"
  "car-booking-api"
  "car-booking-web"
)

for repo in "${repos[@]}"; do
  if [ ! -d "$repo" ]; then
    git clone git@github.com:car-booking-system/$repo.git
  else
    echo "✓ $repo already exists"
  fi
done

# Install dependencies
for repo in "${repos[@]}"; do
  echo "📦 Installing dependencies for $repo..."
  cd $repo && npm install && cd ..
done

# Link packages for local development
cd car-booking-types && npm link && cd ..
cd car-booking-utils && npm link && npm link @car-booking/types && cd ..
cd car-booking-ui && npm link && npm link @car-booking/types @car-booking/utils && cd ..
cd car-booking-api && npm link @car-booking/types @car-booking/utils && cd ..
cd car-booking-web && npm link @car-booking/types @car-booking/utils @car-booking/ui && cd ..

echo "✅ Development environment ready!"
echo "Run 'docker-compose up' to start all services"
EOF

chmod +x setup.sh

git add .
git commit -m "Development environment setup"
git push origin main
```

## Step 8: Cleanup and Archive

```bash
# 1. Stop all running services in monorepo
cd ../car-booking
npm run stop

# 2. Create final backup
git archive --format=tar.gz --output=../car-booking-monorepo-backup.tar.gz HEAD

# 3. Archive monorepo (don't delete yet)
gh repo edit car-booking --archived

# 4. Update team documentation
echo "Migration completed on $(date)" >> MIGRATION_LOG.md
```

## Verification Checklist

```bash
# Test each component independently
cd car-booking-api && npm run dev    # Should start on port 3005
cd car-booking-web && npm run dev    # Should start on port 3001

# Verify package installations
npm list @car-booking/types
npm list @car-booking/utils
npm list @car-booking/ui

# Test cross-repo changes
# Make a change in types, publish, and verify update in web/api
```

## Troubleshooting

### Issue: Package not found
```bash
# Verify npm registry config
npm config get @car-booking:registry

# Check authentication
npm whoami --registry=https://npm.pkg.github.com

# Force reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Type mismatches
```bash
# Ensure all repos use same version
npm update @car-booking/types

# Clear TypeScript cache
rm -rf dist tsconfig.tsbuildinfo
npm run build
```

### Issue: Local development linking
```bash
# Reset all links
npm unlink --global @car-booking/types
npm unlink --global @car-booking/utils
npm unlink --global @car-booking/ui

# Re-establish links
cd packages/types && npm link
cd apps/web && npm link @car-booking/types
```

## Success Validation

✅ All repositories created and pushed
✅ Packages published to registry
✅ Applications run independently
✅ CI/CD pipelines functional
✅ Team can clone and run locally
✅ Production deployments successful

---
*Migration Guide by Winston, System Architect*
*Estimated Duration: 1-2 weeks for complete migration*