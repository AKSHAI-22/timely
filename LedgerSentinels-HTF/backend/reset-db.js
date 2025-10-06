const mongoose = require('mongoose');
const User = require('./models/User');
const ExpertProfile = require('./models/ExpertProfile');

async function resetDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/timely');
    console.log('Connected to MongoDB');

    // Clear all collections
    await User.deleteMany({});
    await ExpertProfile.deleteMany({});
    
    console.log('✅ Database cleared successfully');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error resetting database:', error);
  }
}

resetDatabase();
