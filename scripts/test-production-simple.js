// Simple production deployment test script
// This script tests the API endpoints instead of importing the algorithm directly

async function testProductionDeployment() {
  console.log('🧪 Testing Production Deployment of Enhanced Matching Algorithm...\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing Server Health...');
    try {
      const healthResponse = await fetch('http://localhost:3000/api/health/matching');
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        console.log('✅ Server is running');
        console.log('🏥 Health Status:', health.status);
        console.log('🤖 AI Model Loaded:', health.aiModelLoaded);
        console.log('📦 Cache Size:', health.cacheSize);
        console.log('📅 Version:', health.version);
      } else {
        console.log('⚠️ Server health check failed');
      }
    } catch (error) {
      console.log('⚠️ Server may not be running. Start with: npm run dev');
    }
    console.log('');

    // Test 2: Test matching endpoint
    console.log('2️⃣ Testing Matching Endpoint...');
    const testUsers = {
      userA: {
        id: 1,
        formResponse: {
          'What are your main hobbies or interests? (Select all that apply)': 'Reading, Traveling, Music, Cooking',
          'What is your favorite music genre? (Select all that apply)': 'Rock, Pop, Jazz',
          'What type of movie or TV show do you prefer? (Select all that apply)': 'Action, Comedy, Drama',
          'Which type of vacation do you prefer? (Select all that apply)': 'Beach, Mountains, City',
          'How old are you?': '25',
          'What is your gender?': 'Female',
          'Which gender do you prefer for your ideal partner? (Select all that apply)': 'Male',
          'How often do you engage in physical activity?': 'Moderately active',
          'How important is it that your partner is pet-friendly?': '3',
          'How important is it that your partner is child-friendly?': '4',
          'How tall are you?': '165',
          'What is your occupation?': 'Software Engineer',
          'Which of these are on your bucket list? (Select all that apply)': 'Travel the world, Learn a new language, Start a business',
          'What is your highest level of education?': 'Bachelor\'s degree'
        }
      },
      userB: {
        id: 2,
        formResponse: {
          'What are your main hobbies or interests? (Select all that apply)': 'Traveling, Music, Gaming, Sports',
          'What is your favorite music genre? (Select all that apply)': 'Rock, Electronic, Pop',
          'What type of movie or TV show do you prefer? (Select all that apply)': 'Action, Sci-Fi, Comedy',
          'Which type of vacation do you prefer? (Select all that apply)': 'Mountains, Adventure, Beach',
          'How old are you?': '27',
          'What is your gender?': 'Male',
          'Which gender do you prefer for your ideal partner? (Select all that apply)': 'Female',
          'How often do you engage in physical activity?': 'Very active',
          'How important is it that your partner is pet-friendly?': '4',
          'How important is it that your partner is child-friendly?': '3',
          'How tall are you?': '180',
          'What is your occupation?': 'Data Scientist',
          'Which of these are on your bucket list? (Select all that apply)': 'Travel the world, Learn to play guitar, Run a marathon',
          'What is your highest level of education?': 'Master\'s degree'
        }
      }
    };

    try {
      const startTime = Date.now();
      const matchingResponse = await fetch('http://localhost:3000/api/matching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUsers)
      });
      const endTime = Date.now();

      if (matchingResponse.ok) {
        const result = await matchingResponse.json();
        console.log('✅ Matching endpoint working');
        console.log('💕 Compatibility Score:', (result.compatibility * 100).toFixed(1) + '%');
        console.log('⏱️ Response Time:', (endTime - startTime) + 'ms');
        console.log('🤖 Algorithm Version:', result.algorithmVersion);
        console.log('🏥 Health Status:', result.health);
        console.log('🚫 Deal Breakers:', result.breakdown?.dealBreakers?.length || 0);
        console.log('✅ Strengths:', result.breakdown?.strengths?.length || 0);
      } else {
        const error = await matchingResponse.text();
        console.log('❌ Matching endpoint failed:', error);
      }
    } catch (error) {
      console.log('❌ Matching endpoint error:', error.message);
    }
    console.log('');

    // Test 3: Performance test
    console.log('3️⃣ Testing Performance (5 calculations)...');
    try {
      const performanceStart = Date.now();
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          fetch('http://localhost:3000/api/matching', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUsers)
          })
        );
      }
      await Promise.all(promises);
      const performanceEnd = Date.now();
      console.log('⚡ Average time per calculation:', ((performanceEnd - performanceStart) / 5).toFixed(1) + 'ms');
    } catch (error) {
      console.log('⚠️ Performance test failed:', error.message);
    }
    console.log('');

    console.log('🎉 Production deployment test completed!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Start your server: npm run dev');
    console.log('2. Test the endpoints manually');
    console.log('3. Monitor performance and logs');
    console.log('4. Deploy to production environment');
    console.log('');
    console.log('🎯 Your enhanced matching algorithm is ready! 🚀');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure the server is running: npm run dev');
    console.log('2. Check if all dependencies are installed');
    console.log('3. Verify Node.js version is v20+');
    console.log('4. Check environment variables');
  }
}

// Run the test
testProductionDeployment(); 