const {producer} = require('../config/kafka');

async function connectProducer() {
  await producer.connect();
  console.log('[Kafka:Producer] Connected');
}

async function disconnectProducer() {
  await producer.disconnect();
  console.log('[Kafka:Producer] Disconnected');
}

async function produceMessage(message) {
  await producer.send({
    topic: 'messages',
    messages: [
      {
        key:   message.groupId,       // partition by groupId for ordering
        value: JSON.stringify(message),
      },
    ],
  });
}

module.exports = { connectProducer, disconnectProducer, produceMessage };