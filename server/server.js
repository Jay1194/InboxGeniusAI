require("dotenv").config()
console.log(require('dotenv').config()); 
console.log(process.env); 

const express = require('express');
const session = require('express-session');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const typeDefs = require('./schemas/typeDefs');
const resolvers = require('./schemas/resolvers');
const authRoutes = require('./apis/auth');
const gmailRoutes = require('./apis/gmail');

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

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({
      oauth2Client: req.oauth2Client,
    }),
  });

  await server.start();

  const app = express();

  // Middleware
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

  // Set up API routes
  app.use('/api', authRoutes);
  app.use('/api', gmailRoutes);

  app.get('/session', (req, res) => {
    res.json(req.session);
  });

  // Apply Apollo GraphQL middleware
  server.applyMiddleware({ app });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  // Start the server
  app.listen({ port: 4000 }, () => {
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
  });
}

startServer();


