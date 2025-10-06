const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const contractService = require('./services/contractService');
const { 
  securityHeaders, 
  corsOptions, 
  validateInput, 
  errorHandler, 
  notFound
} = require('./middleware/security');
require('dotenv').config();

const app = express();

// Security middleware (no rate limiting for hackathon)
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(validateInput);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timely');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ 
    req, 
    contractService 
  }),
  introspection: true,
  playground: true,
});

async function startServer() {
  // Initialize contract service (optional)
  try {
    await contractService.initialize();
    console.log('✅ Contract service initialized');
  } catch (error) {
    console.log('⚠️  Contract service not available (contracts not deployed yet)');
    console.log('   Run: npx hardhat compile && npx hardhat run scripts/deploy-all.js --network localhost');
  }
  
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
  
  // Add error handling middleware after GraphQL
  app.use(notFound);
  app.use(errorHandler);
  
  console.log('✅ Apollo Server started');
}

// Import routes
const authRoutes = require('./routes/auth');
const timeSlotRoutes = require('./routes/timeSlots');
const expertRoutes = require('./routes/expert');

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'LedgerSentinels API Server',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'LedgerSentinels API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/time-slots', timeSlotRoutes);
app.use('/api/expert', expertRoutes);

// Error handling middleware (must be last, but after GraphQL)
// Note: GraphQL middleware is added in startServer()

// Start server after Apollo is ready
startServer().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
