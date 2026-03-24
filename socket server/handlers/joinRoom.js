module.exports = function joinChatRoom(socket, payload, cb) {
  const { groupId } = payload;

  if (!groupId) {
    if (cb) cb({ error: 'groupId is required' });
    return;
  }

  socket.join(groupId);
  console.log(`[WS] ${socket.userId} joined room: ${groupId}`);

  // Acknowledge room join.
  if (cb) cb({ success: true, groupId });
};
