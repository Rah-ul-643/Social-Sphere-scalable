require('dotenv').config();

const express     = require('express');
const cors        = require('cors');
const cookieParser = require('cookie-parser');
const mongoose    = require('mongoose');

const connectDB   = require('./config/database');
const auth        = require('./middlewares/auth');
const userRoutes  = require('./api routes/userRoutes');
const chatRoutes  = require('./api routes/chatRoutes');

// -------------------- INIT --------------------

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || '*';
const PORT       = process.env.PORT || 4000;

// -------------------- MIDDLEWARES --------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin:       CLIENT_URL,
  methods:      ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:  true,
}));

// -------------------- ROUTES --------------------

app.use('/api/auth', userRoutes);
app.use('/api/user', auth, userRoutes);
app.use('/api/chat', auth, chatRoutes);

// -------------------- HEALTH CHECK --------------------

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// -------------------- SERVER START --------------------

let server;

async function start() {
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`[API] Server running on port ${PORT}`);
  });
}

// -------------------- GRACEFUL SHUTDOWN --------------------

async function shutdown(signal) {
  console.log(`[API] ${signal} received. Shutting down...`);
  server.close(async () => {
    console.log('[API] HTTP server closed');
    await mongoose.disconnect();
    console.log('[API] MongoDB disconnected');
    process.exit(0);
  });
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((err) => {
  console.error('[API] Fatal startup error:', err.message);
  process.exit(1);
});