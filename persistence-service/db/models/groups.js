const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    group_id: { type: String, index: true },
    messages: [{ type: mongoose.Types.ObjectId, ref: 'messages' }],
  },
  { strict: false }
);

module.exports = mongoose.model('groups', groupSchema);