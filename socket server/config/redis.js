const Redis = require('ioredis');

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

function createClient(name) {
  const client = new Redis({ host: REDIS_HOST, port: REDIS_PORT });

  client.on('connect', () => console.log(`[Redis:${name}] Connected`));
  client.on('error', (err) => console.error(`[Redis:${name}] Error:`, err.message));

  return client;
}

// Two separate clients: publisher and subscribe mode
const redis = createClient('publisher');
const subscriber = createClient('subscriber');

module.exports = { redis, subscriber };
