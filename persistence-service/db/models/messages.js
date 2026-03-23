const mongoose = require('mongoose');


const messageSchema = new mongoose.Schema(
  {
    sender:    { type: String, ref: 'users' },
    message:   { type: String }, 
    messageId: { type: String, sparse: true, index: true },
    groupId:   { type: String, index: true },
    timestamp: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('messages', messageSchema);