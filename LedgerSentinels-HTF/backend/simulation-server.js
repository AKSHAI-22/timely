const express = require('express');
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
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// In-memory storage for simulation
const users = new Map();
const sessions = new Map();

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(validateInput);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize contract service
contractService.initialize();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

// Helper functions
const generateToken = (userId, userType) => {
  return jwt.sign({ userId, userType }, JWT_SECRET, { expiresIn: '24h' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'LedgerSentinels API Server (Simulation Mode)',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    mode: 'simulation'
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, userType, firstName, lastName, phone, walletAddress } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    if (users.has(email)) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user object
    const user = {
      id: Date.now().toString(),
      name: name || `${firstName} ${lastName}`.trim(),
      email,
      password: hashedPassword,
      userType: userType || 'customer',
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      address: walletAddress || '',
      isVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store user
    users.set(email, user);

    // Generate tokens
    const token = generateToken(user.id, user.userType);
    const refreshToken = generateRefreshToken(user.id);

    // Store session
    sessions.set(user.id, { token, refreshToken, user });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: user.address,
          isVerified: user.isVerified,
          isActive: user.isActive
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, walletAddress, signature } = req.body;

    // Validate required fields
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    let user = null;

    // Login method 1: Email + Password
    if (email) {
      user = users.get(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
    }
    // Login method 2: Wallet Address + Password + Signature
    else if (walletAddress && signature) {
      // Find user by wallet address
      for (let [emailKey, userData] of users.entries()) {
        if (userData.address && userData.address.toLowerCase() === walletAddress.toLowerCase()) {
          user = userData;
          break;
        }
      }
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'No account found with this wallet address'
        });
      }

      // In a real implementation, you would verify the signature here
      // For simulation, we'll just check if signature exists and is not empty
      if (!signature || signature.length < 10) {
        return res.status(401).json({
          success: false,
          message: 'Invalid wallet signature'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either email or wallet address is required'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Generate tokens
    const token = generateToken(user.id, user.userType);
    const refreshToken = generateRefreshToken(user.id);

    // Store session
    sessions.set(user.id, { token, refreshToken, user });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: user.address,
          isVerified: user.isVerified,
          isActive: user.isActive
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

app.post('/api/auth/refresh-token', (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const session = sessions.get(decoded.userId);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(decoded.userId, session.user.userType);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    // Update session
    sessions.set(decoded.userId, { token: newToken, refreshToken: newRefreshToken, user: session.user });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      sessions.delete(decoded.userId);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const session = sessions.get(decoded.userId);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = session.user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

app.get('/api/auth/profile', verifyToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        userType: req.user.userType,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        phone: req.user.phone,
        address: req.user.address,
        isVerified: req.user.isVerified,
        isActive: req.user.isActive
      }
    }
  });
});

app.put('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const { name, firstName, lastName, phone, bio } = req.body;
    const user = users.get(req.user.email);

    if (name) user.name = name;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (bio) user.bio = bio;
    user.updatedAt = new Date();

    users.set(req.user.email, user);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: user.address,
          isVerified: user.isVerified,
          isActive: user.isActive
        }
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Profile update failed'
    });
  }
});

// Wallet signature verification endpoint
app.post('/api/auth/verify-wallet', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address, signature, and message are required'
      });
    }

    // In a real implementation, you would verify the signature using ethers.js
    // For simulation, we'll just check if the signature looks valid
    if (signature.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature format'
      });
    }

    // Check if user exists with this wallet address
    let user = null;
    for (let [emailKey, userData] of users.entries()) {
      if (userData.address && userData.address.toLowerCase() === walletAddress.toLowerCase()) {
        user = userData;
        break;
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this wallet address'
      });
    }

    res.json({
      success: true,
      message: 'Wallet signature verified',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          address: user.address
        }
      }
    });

  } catch (error) {
    console.error('Wallet verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Wallet verification failed'
    });
  }
});

// Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ 
    user: req.user,
    contractService 
  })
});

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });

    app.use(notFound);
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log('Contract service initialized successfully');
      console.log('✅ Contract service initialized');
      console.log('✅ Apollo Server started');
      console.log('🚀 Server running on port', PORT);
      console.log('📊 GraphQL endpoint: http://localhost:' + PORT + '/graphql');
      console.log('🔐 Auth endpoints: http://localhost:' + PORT + '/api/auth');
      console.log('📁 Uploads: http://localhost:' + PORT + '/uploads');
      console.log('🎭 SIMULATION MODE - Using in-memory storage');
      console.log('👥 Users stored in memory (will reset on restart)');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();
