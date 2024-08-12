const mongoose = require('mongoose');
const { Schema } = mongoose;

const emailSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true },
  subject: { type: String, default: '' },
  summary: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  category: { type: String, default: '' },
  isPriority: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
  isJunk: { type: Boolean, default: false },
  deleteAt: { type: Date, default: null },
});

emailSchema.index({ deleteAt: 1 }, { expireAfterSeconds: 0 });

const Email = mongoose.model('Email', emailSchema);

module.exports = Email;
