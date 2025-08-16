const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function verifyDatabase() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✓ Connected to database\n');
    
    // List all tables
    const tables = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('Tables created:');
    tables.rows.forEach(r => console.log(`  • ${r.tablename}`));
    
    // Count records in each table
    console.log('\nTable record counts:');
    for (const table of tables.rows) {
      const count = await client.query(`SELECT COUNT(*) FROM ${table.tablename}`);
      console.log(`  • ${table.tablename}: ${count.rows[0].count} records`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

verifyDatabase();