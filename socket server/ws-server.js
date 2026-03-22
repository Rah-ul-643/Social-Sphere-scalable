require('dotenv').config();

const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

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

// -------------------- AUTH MIDDLEWARE --------------------

io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id || decoded.username;

    next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

// -------------------- CONNECTION --------------------

io.on('connection', (socket) => {
  const userId = socket.userId;

  console.log(`User connected: ${userId} | Socket: ${socket.id}`);

  // set the user name on client side
  socket.emit('set-username', userId);

  // Add user to set in redis

  // TODO: update online users' list by sending event (through redis pubsub) and send online users list to this user as well.

  // register all event handlers
  registerHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);

    // remove user from redis onlineusers set.
    // send offline event to other users (through redis pubsub)
  });
});

// -------------------- START --------------------

server.listen(PORT, () => {
  console.log(`WS server running on port ${PORT}`);
});