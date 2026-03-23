const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

async function connectDB() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  await mongoose.connect(MONGO_URI);
  console.log('[DB] MongoDB connected:', mongoose.connection.host);

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[DB] MongoDB error:', err.message);
  });
}

async function disconnectDB() {
  await mongoose.disconnect();
  console.log('[DB] MongoDB disconnected cleanly');
}

module.exports = { connectDB, disconnectDB };
