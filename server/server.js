require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const typeDefs = require('./schemas/typeDefs');
const resolvers = require('./schemas/resolvers');
const authRoutes = require('./apis/auth');
const gmailRoutes = require('./apis/gmail');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/inboxgeniusai', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Start the Express server
async function startServer() {
  const app = express();

  // CORS setup for the entire app
  app.use(cors({
    origin: 'http://localhost:3000', // Allow frontend requests
    credentials: true
  }));

  // Express JSON parser
  app.use(express.json());

  // Session management
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    }
  }));

  // REST API routes
  app.use('/api', authRoutes);
  app.use('/api', gmailRoutes);

  // GraphQL server setup
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const token = req.headers.authorization || '';
      if (token && token.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(token.slice(7), process.env.JWT_SECRET);
          const user = await User.findById(decoded.id);
          return { user };
        } catch (e) {
          console.log('Error verifying token:', e);
        }
      }
      return { user: null };
    },
  });

  await server.start();

  // Apply GraphQL middleware to the Express app
  server.applyMiddleware({ 
    app, 
    path: '/graphql',
    cors: false // Handle CORS at the Express level
  });

  // General error handling
  app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
      message: 'Something broke!',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  });

  // Start the server
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}${server.graphqlPath}`);
  });
}

// Run the server
startServer();
