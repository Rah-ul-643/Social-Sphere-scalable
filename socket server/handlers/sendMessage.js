const { v4: uuidv4 } = require('uuid');
const { redis } = require('../config/redis');
const { produceMessage } = require('../kafka/producer');


module.exports = async function handleSendMessage(io, socket, payload) {
  const { groupId, content } = payload;

  if (!groupId || !content) {
    socket.emit('msg-error', { error: 'groupId and content are required' });
    return;
  }

  const message = {
    messageId: uuidv4(),
    groupId,
    sender: socket.userId,
    content,
    timestamp: Date.now(),
  };

  // 1: Persist via Kafka — must succeed before real-time delivery
  try {
    await produceMessage(message);
  } catch (err) {
    console.error(`[Kafka] Failed to produce message for group ${groupId}:`, err.message);
    socket.emit('msg-error', { error: 'Message could not be sent. Please try again.' });
    return; // Do NOT publish to Redis if Kafka failed
  }

  // 2: Real-time delivery via Redis Pub/Sub
  try {
    await redis.publish('messages', JSON.stringify(message));
  } catch (err) {
    console.error(`[Redis] Publish failed for group ${groupId}:`, err.message);
  }
};
