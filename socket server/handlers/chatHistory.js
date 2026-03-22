module.exports = function handleChatHistory(socket, payload, cb) {
  // TODO: call API service instead of DB directly
  cb({ messages: [] });
};