# Database Setup Instructions

## You need to add a DATABASE_URL to your .env file

### Option 1: Local PostgreSQL
If you have PostgreSQL installed locally:

```bash
# Add to .env file:
DATABASE_URL=postgresql://postgres:password@localhost:5432/car_booking
```

Then create the database:
```bash
createdb car_booking
```

### Option 2: Supabase (Free Cloud Database)
1. Go to https://supabase.com
2. Create a new project (free)
3. Go to Settings → Database
4. Copy the connection string
5. Add to .env file:

```bash
# Add to .env file:
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Option 3: Railway (Simple Cloud Database)
1. Go to https://railway.app
2. Create new project → Add PostgreSQL
3. Copy the DATABASE_URL from the Connect tab
4. Add to .env file

### Option 4: Docker PostgreSQL
```bash
# Run PostgreSQL in Docker:
docker run --name car-booking-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=car_booking \
  -p 5432:5432 \
  -d postgres:15

# Then add to .env:
DATABASE_URL=postgresql://postgres:password@localhost:5432/car_booking
```

## After adding DATABASE_URL to .env:

```bash
# Push the schema
npm run db:push

# Seed with test data
npm run db:seed
```

## Current .env file needs:
```env
CORS_ORIGIN=http://localhost:3001
BETTER_AUTH_SECRET=AyuEkGeBO0Qv3YFzgCUIqIugo24unCnG
BETTER_AUTH_URL=http://localhost:3000

# ADD THIS LINE:
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
```