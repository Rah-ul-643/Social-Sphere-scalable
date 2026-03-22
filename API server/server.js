require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/database');
const auth = require('./middlewares/auth');

const userRoutes = require('./api routes/userRoutes');
const chatRoutes = require('./api routes/chatRoutes');

// -------------------- INIT --------------------

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || '*';
const PORT = process.env.PORT || 4000;

// -------------------- MIDDLEWARES --------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// -------------------- ROUTES --------------------

app.use('/api/auth', userRoutes);
app.use('/api/user', auth, userRoutes);
app.use('/api/chat', auth, chatRoutes);

// -------------------- HEALTH CHECK --------------------

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// -------------------- SERVER START --------------------

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();