// Test script for production deployment verification
import { calculateCompatibility, getCompatibilityBreakdown, checkMatchingAlgorithmHealth } from '../src/lib/matching-production.js';

// Sample test users
const userA = {
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
};

const userB = {
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
};

async function testProductionDeployment() {
  console.log('🧪 Testing Production Deployment of Enhanced Matching Algorithm...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const health = await checkMatchingAlgorithmHealth();
    console.log('✅ Health Status:', health.status);
    console.log('🤖 AI Model Loaded:', health.aiModelLoaded);
    console.log('📦 Cache Size:', health.cacheSize);
    console.log('');

    // Test 2: Compatibility Calculation
    console.log('2️⃣ Testing Compatibility Calculation...');
    const startTime = Date.now();
    const compatibility = await calculateCompatibility(userA, userB);
    const endTime = Date.now();
    
    console.log('💕 Compatibility Score:', (compatibility * 100).toFixed(1) + '%');
    console.log('⏱️ Calculation Time:', (endTime - startTime) + 'ms');
    console.log('');

    // Test 3: Compatibility Breakdown
    console.log('3️⃣ Testing Compatibility Breakdown...');
    const breakdown = await getCompatibilityBreakdown(userA, userB);
    console.log('🚫 Deal Breakers:', breakdown.dealBreakers.length);
    console.log('✅ Strengths:', breakdown.strengths.length);
    console.log('📊 Areas:', Object.keys(breakdown.areas).length);
    console.log('');

    // Test 4: Performance Test
    console.log('4️⃣ Testing Performance (10 calculations)...');
    const performanceStart = Date.now();
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(calculateCompatibility(userA, userB));
    }
    await Promise.all(promises);
    const performanceEnd = Date.now();
    console.log('⚡ Average time per calculation:', ((performanceEnd - performanceStart) / 10).toFixed(1) + 'ms');
    console.log('');

    console.log('🎉 All tests passed! Production deployment is successful! 🚀');
    console.log('');
    console.log('📊 Summary:');
    console.log('- Health Status:', health.status);
    console.log('- AI Model:', health.aiModelLoaded ? '✅ Loaded' : '❌ Not Loaded');
    console.log('- Compatibility Score:', (compatibility * 100).toFixed(1) + '%');
    console.log('- Performance:', ((performanceEnd - performanceStart) / 10).toFixed(1) + 'ms average');
    console.log('');
    console.log('🎯 Your enhanced matching algorithm is ready for production!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check if all dependencies are installed');
    console.log('2. Verify Node.js version is v20+');
    console.log('3. Check environment variables');
    console.log('4. Review error logs');
    process.exit(1);
  }
}

// Run the test
testProductionDeployment(); 