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

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/inboxgeniusai', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

async function startServer() {
  const app = express();

  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));

  app.use(express.json());
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    }
  }));

  app.use('/api', authRoutes);
  app.use('/api', gmailRoutes);

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

  server.applyMiddleware({ 
    app, 
    path: '/graphql',
    cors: false // Disable Apollo Server's CORS as we're handling it with express cors middleware
  });

  app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
      message: 'Something broke!',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  });

  const path = require('path');

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

// Serve the React app for any non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});


  const port = process.env.PORT || 4000;
  app.listen(port, () => {
      console.log(`Server running on port ${port}`);
  });
  
}

startServer();