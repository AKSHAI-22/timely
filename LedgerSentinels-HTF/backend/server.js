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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timely', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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
}

startServer();

// Import routes
const authRoutes = require('./routes/auth');

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'LedgerSentinels API Server',
    version: '1.0.0',
    status: 'running'
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);
});

module.exports = app;
