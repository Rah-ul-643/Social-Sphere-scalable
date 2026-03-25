require('dotenv').config();

const { connectDB, disconnectDB } = require('./db/connection');
const consumer = require('./kafka/consumer');

const BATCH_SIZE       = parseInt(process.env.BATCH_SIZE        || '50',   10);
const FLUSH_INTERVAL_MS = parseInt(process.env.FLUSH_INTERVAL_MS || '2000', 10);

// -------------------- BATCH BUFFER --------------------

let buffer    = [];
let flushTimer = null;
let saveBatch;  

async function flush() {
  if (!buffer.length) return;

  // Drain the buffer atomically before the async write,
  // so new messages arriving during the write go into a fresh buffer.
  const batch = buffer.splice(0, buffer.length);

  try {
    await saveBatch(batch);
  } catch (err) {
    console.error('[DB] Batch write failed:', err.message);
    // Re-queue so the batch is retried on the next flush cycle.
    buffer.unshift(...batch);
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    await flush();
  }, FLUSH_INTERVAL_MS);
}

// -------------------- KAFKA CONSUMER --------------------

async function start() {
  // 1: connect to MongoDB first
  await connectDB();

  // 2: require the repository
  ({ saveBatch } = require('./db/messageRepository'));

  // 3: connect Kafka and start consuming
  await consumer.connect();
  console.log('[Kafka:Consumer] Connected');

  await consumer.subscribe({ topic: 'messages', fromBeginning: false });
  console.log('[Kafka:Consumer] Subscribed to topic: messages');

  await consumer.run({
    eachMessage: async ({ message }) => {
      let parsed;
      try {
        parsed = JSON.parse(message.value.toString());
      } catch (err) {
        console.error('[Kafka:Consumer] Invalid JSON, skipping:', message.value.toString());
        return;
      }

      buffer.push(parsed);
      console.log(`[Kafka:Consumer] Buffered message ${parsed.messageId} (buffer: ${buffer.length})`);

      if (buffer.length >= BATCH_SIZE) {
        // Flush immediately — no need to wait for the timer
        if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
        await flush();
      } else {
        scheduleFlush();
      }
    },
  });
}

// -------------------- GRACEFUL SHUTDOWN --------------------

async function shutdown() {
  console.log('[Persistence] Shutting down...');

  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  await flush(); // drain any remaining buffered messages before exit

  await consumer.disconnect();
  await disconnectDB();

  console.log('[Persistence] Shutdown complete');
  process.exit(0);
}

process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);

start().catch((err) => {
  console.error('[Persistence] Fatal startup error:', err.message);
  process.exit(1);
});
