// Test script to verify rate limiting
// Run with: node scripts/test-rate-limits.js

const API_URL = 'http://localhost:3000/api/chat';

async function testRateLimiting() {
  console.log('🧪 Testing Rate Limiting...\n');
  
  const requests = [];
  
  // Make 15 requests rapidly (should hit the 10/minute limit)
  for (let i = 0; i < 15; i++) {
    requests.push(
      fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your auth headers here if needed
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: `Test message ${i + 1}` }
          ],
          userId: 'test-user',
          sessionId: 'test-session' // Add sessionId for memory isolation
        })
      }).then(async (response) => {
        const data = await response.json().catch(() => ({}));
        return {
          request: i + 1,
          status: response.status,
          data: data
        };
      })
    );
  }
  
  const results = await Promise.all(requests);
  
  console.log('📊 Rate Limit Test Results:');
  results.forEach(result => {
    const status = result.status === 429 ? '❌ RATE LIMITED' : 
                   result.status === 200 ? '✅ SUCCESS' : 
                   `⚠️  ${result.status}`;
    console.log(`Request ${result.request}: ${status}`);
  });
  
  const rateLimited = results.filter(r => r.status === 429).length;
  const successful = results.filter(r => r.status === 200).length;
  
  console.log(`\n📈 Summary:`);
  console.log(`- Successful: ${successful}`);
  console.log(`- Rate Limited: ${rateLimited}`);
  console.log(`- Rate limiting working: ${rateLimited > 0 ? '✅ YES' : '❌ NO'}`);
}

testRateLimiting().catch(console.error); 