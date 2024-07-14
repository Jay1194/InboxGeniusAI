const emails = [];
const users = [];

const resolvers = {
  Query: {
    getEmails: () => emails,
    getEmail: (_, { id }) => emails.find(email => email.id === id),
    getUser: (_, { id }) => users.find(user => user.id === id),
  },
  Mutation: {
    createUser: (_, { name, email }) => {
      const newUser = { id: String(users.length + 1), name, email };
      users.push(newUser);
      return newUser;
    },
    createEmail: (_, { sender, recipient, subject, body }) => {
      const newEmail = { id: String(emails.length + 1), sender, recipient, subject, body, date: new Date().toISOString() };
      emails.push(newEmail);
      return newEmail;
    },
    updateEmail: (_, { id, category, priority, summary, sentiment }) => {
      const email = emails.find(email => email.id === id);
      if (email) {
        if (category) email.category = category;
        if (priority) email.priority = priority;
        if (summary) email.summary = summary;
        if (sentiment) email.sentiment = sentiment;
      }
      return email;
    },
    deleteEmail: (_, { id }) => {
      const index = emails.findIndex(email => email.id === id);
      if (index !== -1) {
        return emails.splice(index, 1)[0];
      }
      return null;
    },
  },
};

module.exports = resolvers;
