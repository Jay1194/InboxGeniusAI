const User = require('../models/User');
const Email = require('../models/Email');

const resolvers = {
  Query: {
    getEmails: async (_, { archived }, context) => {
      if (!context.user) {
        throw new Error('You must be logged in to view emails');
      }
      return Email.find({ archived: archived !== undefined ? archived : false });
    },
    getEmail: async (_, { id }, context) => {
      if (!context.user) {
        throw new Error('You must be logged in to view an email');
      }
      return Email.findById(id);
    },
    getUser: async (_, { id }, context) => {
      if (!context.user) {
        throw new Error('You must be logged in to view user information');
      }
      return User.findById(id);
    },
    me: async (_, __, context) => {
      if (!context.user) {
        throw new Error('You must be logged in to view your information');
      }
      return context.user;
    },
  },
  Mutation: {
    createUser: async (_, { name, email }) => {
      const user = new User({ name, email });
      await user.save();
      return user;
    },
    createEmail: async (_, { sender, recipient, subject, body }, context) => {
      if (!context.user) {
        throw new Error('You must be logged in to create an email');
      }
      const email = new Email({ sender, recipient, subject, body });
      await email.save();
      return email;
    },
    updateEmail: async (_, { id, ...updateData }, context) => {
      if (!context.user) {
        throw new Error('You must be logged in to update an email');
      }
      return Email.findByIdAndUpdate(id, updateData, { new: true });
    },
    deleteEmail: async (_, { id }, context) => {
      if (!context.user) {
        throw new Error('You must be logged in to delete an email');
      }
      return Email.findByIdAndDelete(id);
    },
    archiveEmail: async (_, { id }, context) => {
      if (!context.user) {
        throw new Error('You must be logged in to archive an email');
      }
      return Email.findByIdAndUpdate(id, { archived: true }, { new: true });
    },
    unarchiveEmail: async (_, { id }, context) => {
      if (!context.user) {
        throw new Error('You must be logged in to unarchive an email');
      }
      return Email.findByIdAndUpdate(id, { archived: false }, { new: true });
    },
  },
};

module.exports = resolvers;