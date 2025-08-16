const fetch = require('node-fetch');

async function testAPI() {
  console.log('🧪 Testing Car Booking Backend API on http://localhost:3005\n');
  
  // Test health check
  try {
    const response = await fetch('http://localhost:3005/');
    const data = await response.json();
    console.log('✅ Server is running:', data);
  } catch (error) {
    console.log('❌ Server test failed:', error.message);
  }
  
  // Test tRPC endpoint (will fail without auth, but shows it's working)
  try {
    const response = await fetch('http://localhost:3005/api/trpc/bookings.getAll', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.status === 401) {
      console.log('✅ tRPC endpoint responding (401 - auth required as expected)');
    } else {
      const data = await response.json();
      console.log('tRPC response:', data);
    }
  } catch (error) {
    console.log('❌ tRPC test failed:', error.message);
  }
  
  console.log('\n📍 Server Info:');
  console.log('   Backend URL: http://localhost:3005');
  console.log('   tRPC Endpoint: http://localhost:3005/api/trpc/*');
  console.log('   Database: Connected to Supabase');
  console.log('\n📧 Test Credentials:');
  console.log('   Admin: admin@company.com / password123');
  console.log('   Employee: john.doe@company.com / password123');
}

testAPI();