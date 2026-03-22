const handleSendMessage = require('./sendMessage');
const handleChatHistory = require('./chatHistory');
const handleConversations = require('./conversations');

module.exports = function registerHandlers(io, socket) {
  socket.on('send-msg', (payload) => {
    handleSendMessage(io, socket, payload);
  });

  socket.on('chat-history', (payload, cb) => {
    handleChatHistory(socket, payload, cb);
  });

  socket.on('retrieve-conversations', (cb) => {
    handleConversations(socket, cb);
  });
};