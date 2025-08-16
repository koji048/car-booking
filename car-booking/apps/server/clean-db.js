const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function cleanDatabase() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Drop the conflicting table
    await client.query('DROP TABLE IF EXISTS kv_store_d02bdd84 CASCADE');
    console.log('Dropped kv_store_d02bdd84 table if it existed');
    
    // List existing tables
    const result = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    console.log('Existing tables:', result.rows.map(r => r.tablename));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

cleanDatabase();