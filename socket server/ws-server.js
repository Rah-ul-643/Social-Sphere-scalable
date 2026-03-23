require('dotenv').config();

const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

const { redis, subscriber } = require('./config/redis');
const registerHandlers = require('./handlers');

const CLIENT_URL = process.env.CLIENT_URL;
const JWT_SECRET = process.env.JWT_SECRET_KEY;
const PORT = process.env.WS_PORT || 5000;

// -------------------- INIT --------------------

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// -------------------- REDIS SUBSCRIPTIONS --------------------

// Subscribe to both channels once at startup (shared across all WS server instances)
subscriber.subscribe('messages', 'presence', (err, count) => {
  if (err) {
    console.error('[Redis] Failed to subscribe:', err.message);
    process.exit(1);
  }
  console.log(`[Redis] Subscribed to ${count} channel(s): messages, presence`);
});

subscriber.on('message', (channel, raw) => {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    console.error(`[Redis] Invalid JSON on channel "${channel}":`, raw);
    return;
  }

  if (channel === 'messages') {
    // Deliver only to sockets that have explicitly joined this room
    io.to(payload.groupId).emit('receive-msg', payload);
  }

  if (channel === 'presence') {
    if (payload.type === 'USER_ONLINE') {
      io.emit('user-online', payload.userId);
    } else if (payload.type === 'USER_OFFLINE') {
      io.emit('user-offline', payload.userId);
    }
  }
});

// -------------------- AUTH MIDDLEWARE --------------------

io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) return next(new Error('Authentication error: No token'));

    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id || decoded.username;
    next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

// -------------------- CONNECTION --------------------

io.on('connection', async (socket) => {
  const userId = socket.userId;
  console.log(`[WS] User connected: ${userId} | Socket: ${socket.id}`);

  socket.emit('set-username', userId);

  try {
    await redis.sadd('online_users', userId);
    await redis.publish('presence', JSON.stringify({ type: 'USER_ONLINE', userId }));

    // Send full snapshot of online users to this socket only
    const onlineUsers = await redis.smembers('online_users');
    socket.emit('online-users', onlineUsers);
  } catch (err) {
    console.error(`[Redis] Presence setup failed for ${userId}:`, err.message);
  }

  registerHandlers(io, socket);

  socket.on('disconnect', async () => {
    console.log(`[WS] User disconnected: ${userId}`);
    try {
      await redis.srem('online_users', userId);
      await redis.publish('presence', JSON.stringify({ type: 'USER_OFFLINE', userId }));
    } catch (err) {
      console.error(`[Redis] Presence teardown failed for ${userId}:`, err.message);
    }
  });
});

// -------------------- START --------------------

server.listen(PORT, () => {
  console.log(`[WS] Server running on port ${PORT}`);
});
