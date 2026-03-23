const handleSendMessage = require('./sendMessage');
const joinChatRoom = require('./joinRoom');

module.exports = function registerHandlers(io, socket) {
  // Client sends a message to a group
  socket.on('send-msg', (payload) => {
    handleSendMessage(io, socket, payload);
  });

  // Client opens a chat — joins the room and acknowledges
  socket.on('join-chat-room', (payload, cb) => {
    joinChatRoom(socket, payload, cb);
  });

  // Client explicitly leaves a room (e.g., navigates away from chat)
  socket.on('leave-room', ({ groupId }) => {
    if (groupId) {
      socket.leave(groupId);
      console.log(`[WS] ${socket.userId} left room: ${groupId}`);
    }
  });
};
