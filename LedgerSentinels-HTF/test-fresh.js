const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Fresh test data with timestamps
const timestamp = Date.now();
const random1 = Math.random().toString(36).substring(2, 15);
const random2 = Math.random().toString(36).substring(2, 15);
const testUser = {
  name: `Test User ${timestamp}`,
  email: `testuser${timestamp}@example.com`,
  password: 'password123',
  walletAddress: `0x${random1}${random2}`.substring(0, 42),
  userType: 'customer'
};

const testExpert = {
  name: `Test Expert ${timestamp}`,
  email: `testexpert${timestamp}@example.com`,
  password: 'password123',
  walletAddress: `0x${random2}${random1}`.substring(0, 42),
  userType: 'expert'
};

let authToken = '';
let expertToken = '';

async function testAPI() {
  console.log('🧪 Testing Fresh Backend API Flow...\n');

  try {
    // 1. Test Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health Check:', healthResponse.data.message);

    // 2. Test User Registration
    console.log('\n2. Testing User Registration...');
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    console.log('✅ User Registration:', registerResponse.data.message);
    authToken = registerResponse.data.data.token;

    // 3. Test Expert Registration
    console.log('\n3. Testing Expert Registration...');
    const expertRegisterResponse = await axios.post(`${BASE_URL}/api/auth/register`, testExpert);
    console.log('✅ Expert Registration:', expertRegisterResponse.data.message);
    expertToken = expertRegisterResponse.data.data.token;

    // 4. Test Expert Profile Creation
    console.log('\n4. Testing Expert Profile Creation...');
    try {
      const expertProfileResponse = await axios.post(`${BASE_URL}/api/expert/profile`, {
        profession: 'Software Developer',
        description: 'Experienced full-stack developer with 5+ years of experience',
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        experience: [{ company: 'Tech Corp', position: 'Senior Developer', duration: '2 years' }],
        hourlyRate: 50,
        availability: { monday: true, tuesday: true, wednesday: true },
        languages: [{ language: 'English', proficiency: 'Native' }, { language: 'Spanish', proficiency: 'Advanced' }]
      }, {
        headers: { Authorization: `Bearer ${expertToken}` }
      });
      console.log('✅ Expert Profile Created:', expertProfileResponse.data.message);
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('⚠️  Expert profile already exists, continuing...');
      } else {
        throw error;
      }
    }

    // 5. Test Time Slot Creation
    console.log('\n5. Testing Time Slot Creation...');
    const timeSlotResponse = await axios.post(`${BASE_URL}/api/time-slots/create`, {
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      price: '0.1',
      description: 'Test consultation slot'
    }, {
      headers: { Authorization: `Bearer ${expertToken}` }
    });
    console.log('✅ Time Slot Created:', timeSlotResponse.data.message);
    console.log('   Token ID:', timeSlotResponse.data.data.tokenId);

    // 6. Test Available Time Slots
    console.log('\n6. Testing Available Time Slots...');
    const availableSlotsResponse = await axios.get(`${BASE_URL}/api/time-slots/available`);
    console.log('✅ Available Time Slots:', availableSlotsResponse.data.data.length, 'slots found');

    // 7. Test Expert Time Slots
    console.log('\n7. Testing Expert Time Slots...');
    const expertSlotsResponse = await axios.get(`${BASE_URL}/api/time-slots/expert`, {
      headers: { Authorization: `Bearer ${expertToken}` }
    });
    console.log('✅ Expert Time Slots:', expertSlotsResponse.data.data.length, 'slots found');

    // 8. Test Expert Profiles
    console.log('\n8. Testing Expert Profiles...');
    const expertProfilesResponse = await axios.get(`${BASE_URL}/api/expert/profiles`);
    console.log('✅ Expert Profiles:', expertProfilesResponse.data.data.length, 'profiles found');

    // 9. Test User Profile
    console.log('\n9. Testing User Profile...');
    const userProfileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ User Profile:', userProfileResponse.data.data.name);

    // 10. Test GraphQL
    console.log('\n10. Testing GraphQL...');
    const graphqlResponse = await axios.post(`${BASE_URL}/graphql`, {
      query: `
        query {
          users {
            name
            email
            userType
          }
        }
      `
    });
    console.log('✅ GraphQL Query:', graphqlResponse.data.data.users.length, 'users found');

    console.log('\n🎉 All Backend Tests Completed Successfully!');
    console.log('\n📋 Backend API Status:');
    console.log('   • Health Check: ✅ Working');
    console.log('   • Authentication: ✅ Working');
    console.log('   • Expert Profiles: ✅ Working');
    console.log('   • Time Slots: ✅ Working');
    console.log('   • GraphQL: ✅ Working');
    console.log('   • Smart Contracts: ✅ Connected');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.response?.data?.message || error.message);
    if (error.response?.data?.error) {
      console.error('   Error Details:', error.response.data.error);
    }
  }
}

// Run the test
testAPI();
