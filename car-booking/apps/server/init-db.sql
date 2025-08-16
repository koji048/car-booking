-- Drop existing tables if they exist
DROP TABLE IF EXISTS kv_store_d02bdd84 CASCADE;

-- Create all tables fresh
-- This will allow drizzle-kit to recognize them as existing tables