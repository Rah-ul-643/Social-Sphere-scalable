const connectionManager = require('../connection/manager');

module.exports = function handleSendMessage(io, socket, payload) {
  const { to, message, groupId } = payload;

  const receiverSocket = connectionManager.get(to);

  const msg = {
    from: socket.userId,
    to,
    message,
    groupId,
    timestamp: Date.now(),
  };

  // deliver if online
  if (receiverSocket) {
    receiverSocket.emit('receive-msg', msg);
  }

  // echo back to sender
  socket.emit('message-sent', msg);

  // FUTURE:
  // kafka.produce(msg)
};