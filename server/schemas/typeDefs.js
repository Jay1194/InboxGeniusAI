const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Email {
    id: ID!
    sender: String!
    recipient: String!
    subject: String!
    body: String!
    date: String!
    category: String
    priority: String
    summary: String
    sentiment: String
  }

  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Query {
    getEmails: [Email]
    getEmail(id: ID!): Email
    getUser(id: ID!): User
  }

  type Mutation {
    createUser(name: String!, email: String!): User
    createEmail(sender: String!, recipient: String!, subject: String!, body: String!): Email
    updateEmail(id: ID!, category: String, priority: String, summary: String, sentiment: String): Email
    deleteEmail(id: ID!): Email
  }
`;

module.exports = typeDefs;