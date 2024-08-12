const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  sender: String,
  recipient: String,
  subject: String,
  body: String,
  date: { type: Date, default: Date.now },
  category: String,
  priority: String,
  summary: String,
  sentiment: String,
  archived: { type: Boolean, default: false },
});

module.exports = mongoose.model('Email', emailSchema);