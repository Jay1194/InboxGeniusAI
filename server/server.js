const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('../server/schemas/typeDefs');
const resolvers = require('./schemas/resolvers');

async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  const app = express();
  server.applyMiddleware({ app });

  app.listen({ port: 4000 }, () => {
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
  });
}

startServer();
