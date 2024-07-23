const Email = require('../models/Email');
const User = require('../models/User');

const resolvers = {
  Query: {
    getEmails: async (_, __, context) => {
      if (!context.user) throw new Error('Not authenticated');
      return await Email.find({ user: context.user.id });
    },
    getEmail: async (_, { id }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      return await Email.findOne({ _id: id, user: context.user.id });
    },
    getUser: async (_, { id }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      return await User.findById(id);
    },
    me: async (_, __, context) => {
      if (!context.user) throw new Error('Not authenticated');
      return context.user;
    },
  },
  Mutation: {
    createUser: async (_, { name, email }) => {
      const newUser = new User({ name, email });
      await newUser.save();
      return newUser;
    },
    createEmail: async (_, { sender, recipient, subject, body }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      const newEmail = new Email({
        sender,
        recipient,
        subject,
        body,
        date: new Date().toISOString(),
        user: context.user.id
      });
      await newEmail.save();
      return newEmail;
    },
    updateEmail: async (_, { id, category, priority, summary, sentiment }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      const email = await Email.findOne({ _id: id, user: context.user.id });
      if (!email) throw new Error('Email not found');
      
      if (category) email.category = category;
      if (priority) email.priority = priority;
      if (summary) email.summary = summary;
      if (sentiment) email.sentiment = sentiment;
      
      await email.save();
      return email;
    },
    deleteEmail: async (_, { id }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      const email = await Email.findOneAndDelete({ _id: id, user: context.user.id });
      if (!email) throw new Error('Email not found');
      return email;
    },
  },
};

module.exports = resolvers;