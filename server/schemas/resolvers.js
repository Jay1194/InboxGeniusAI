const Email = require('../models/Email');
const User = require('../models/User');

const resolvers = {
  Query: {
    getEmails: async () => {
      return await Email.find();
    },
    getEmail: async (_, { id }) => {
      return await Email.findById(id);
    },
    getUser: async (_, { id }) => {
      return await User.findById(id);
    },
  },
  Mutation: {
    createUser: async (_, { name, email }) => {
      const newUser = new User({ name, email });
      await newUser.save();
      return newUser;
    },
    createEmail: async (_, { sender, recipient, subject, body }) => {
      const newEmail = new Email({ sender, recipient, subject, body });
      await newEmail.save();
      return newEmail;
    },
    updateEmail: async (_, { id, category, priority, summary, sentiment }) => {
      const email = await Email.findById(id);
      if (email) {
        if (category) email.category = category;
        if (priority) email.priority = priority;
        if (summary) email.summary = summary;
        if (sentiment) email.sentiment = sentiment;
        await email.save();
      }
      return email;
    },
    deleteEmail: async (_, { id }) => {
      const email = await Email.findByIdAndDelete(id);
      return email;
    },
  },
};

module.exports = resolvers;
