# 🌐 Social Sphere

> A **scalable, production-grade real-time group chat application** built with a microservices-inspired architecture — featuring a decoupled WebSocket server, an async message persistence pipeline, and Redis-backed cross-instance presence broadcasting.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Benchmark & Performance Notes](#benchmark--performance-notes)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Scalability Design](#scalability-design)

---

## Overview

Social Sphere is a full-stack real-time group chat application designed with **horizontal scalability** as a first-class concern. Unlike monolithic chat apps, Social Sphere separates concerns across four independently deployable services:

| Service | Role |
|---|---|
| **Client** | React SPA — user interface |
| **API Server** | REST endpoints for auth, user, and group management |
| **Socket Server** | WebSocket layer for real-time messaging and presence |
| **Persistence Service** | Kafka consumer that durably writes messages to MongoDB |

Messages flow through **Apache Kafka** for durability and **Redis Pub/Sub** for low-latency real-time delivery — meaning the socket layer never blocks on a database write, and multiple socket server instances can fan-out messages to all connected clients.

---

## Features

### Authentication & User Management
- **JWT-based authentication** with HTTP-only cookie storage for XSS protection
- Secure **bcrypt password hashing** (salt rounds: 10)
- User registration and login with duplicate username detection
- Profile view and update (display name)
- Token-protected REST endpoints with auth middleware

### Group Chat
- **Create groups** with a UUID-based invite code
- **Join groups** via invite code — requests queue as join requests until admin approves
- **Admin controls**: approve/deny join requests, add participants, remove members
- **Leave group** — auto-deletes the group if the last member leaves; admin cannot leave without transferring ownership
- **Paginated message history** (configurable page size, max 100 per page)

### Real-Time Messaging
- **WebSocket-based messaging** via Socket.IO — messages appear instantly without polling
- **Socket.IO rooms** — each group is its own room; messages are only delivered to room members
- **Redis Pub/Sub fan-out** — all socket server instances receive published messages, enabling scale-out without sticky sessions
- Messages are **Kafka-produced first** before Redis publish, ensuring no message is delivered without durability

### Presence System
- **Online/offline user tracking** with Redis Sets (`online_users`)
- **Presence broadcast** via a dedicated Redis `presence` channel
- New socket connections immediately receive the full online users snapshot
- Presence events propagate to all connected clients in real time

### Persistence Pipeline
- **Kafka consumer** (`persistence-service`) subscribes to the `messages` topic
- **Batched writes** to MongoDB: configurable `BATCH_SIZE` (default 50) and `FLUSH_INTERVAL_MS` (default 2000ms) reduce write amplification
- **Idempotent inserts** — duplicate `messageId` keys are silently skipped (`ordered: false` + duplicate key error handling)
- Messages are **linked to their group document** via `$push` bulk write after insertion
- Graceful shutdown drains the in-memory buffer before exiting

### Frontend UX
- **Dark / Light mode** toggle with persistent state
- **Responsive layout** — collapses to single-column on mobile (≤768px) with slide-in/out transitions
- Animated modals (Framer Motion) for group creation, joining, profile editing, group management
- **Emoji picker** in the message input bar
- Real-time **conversation list reordering** — active group bubbles to top on new message
- Inline chat loader (GIF) while fetching message history

---

## Tech Stack

### Frontend — `client/`

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.3 | Component-based UI framework |
| **React Router DOM** | 6.23 | Client-side routing (SPA navigation) |
| **Socket.IO Client** | 4.7 | WebSocket connection to the socket server |
| **Axios** | 1.7 | HTTP client for REST API calls |
| **Framer Motion** | 11.2 | Declarative animations for modals and transitions |
| **emoji-picker-react** | 4.12 | Emoji selection UI for the message input bar |
| **react-hot-toast** | 2.4 | Non-intrusive toast notification system |

**React** serves as the rendering engine using functional components and hooks (`useState`, `useEffect`, `useCallback`). The app uses `localStorage` for token persistence and `React Router` for guarded routes (login redirect when unauthenticated).

### API Server — `API server/`

| Technology | Version | Purpose |
|---|---|---|
| **Node.js + Express** | 4.19 | HTTP server and routing framework |
| **Mongoose** | 8.4 | MongoDB ODM — schema definition and query builder |
| **jsonwebtoken** | 9.0 | JWT signing and verification |
| **bcrypt** | 5.1 | Password hashing |
| **cookie-parser** | 1.4 | Parses HTTP-only cookies for JWT extraction |
| **cors** | 2.8 | Configurable cross-origin policy |
| **uuid** | 10.0 | Group ID generation |
| **dotenv** | 16.4 | Environment variable loading |

Express acts as the thin HTTP layer — all business logic lives in controllers. Auth is enforced via a middleware that extracts and verifies the JWT from the request cookie before any protected route handler runs.

### Socket Server — `socket server/`

| Technology | Version | Purpose |
|---|---|---|
| **Node.js + Express** | 5.2 | Base HTTP server (Socket.IO requires an HTTP server) |
| **Socket.IO** | 4.8 | WebSocket abstraction with rooms, namespaces, and auth middleware |
| **ioredis** | 5.10 | Redis client — publisher and subscriber (two separate connections) |
| **KafkaJS** | 2.2 | Kafka producer — publishes messages to the `messages` topic |
| **jsonwebtoken** | 9.0 | Validates socket connections via JWT in handshake auth |
| **uuid** | 9.0 | `messageId` generation before Kafka publish |

Two Redis connections are maintained — one for publishing commands (`redis`) and a separate one for subscribe mode (`subscriber`), as Redis does not allow a single connection to mix publish and subscribe after entering subscribe mode.

### Persistence Service — `persistence-service/`

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | — | Service runtime |
| **KafkaJS** | 2.2 | Kafka consumer — reads from the `messages` topic |
| **Mongoose** | 9.3 | MongoDB write layer — bulk inserts and bulk writes |
| **dotenv** | 16.0 | Config injection |

This service is intentionally stateless beyond its in-memory write buffer, making it safe to run multiple instances in the same Kafka consumer group for parallel partition consumption.

### Infrastructure

| Technology | Purpose |
|---|---|
| **MongoDB** | Primary database — stores users, groups, and messages |
| **Apache Kafka** | Durable message queue — decouples socket server from DB writes |
| **Redis** | Pub/Sub fan-out for real-time delivery + online presence tracking |

---

## System Architecture
 
```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT (React)                               │
│                        REST   +  WebSocket (Socket.IO)                  │
└──────────┬──────────────────────────────────┬───────────────────────────┘
           │ REST                             │ WebSocket
           ▼                                  ▼
┌─────────────────────┐            ┌────────────────────────┐
│     API SERVER      │            │     SOCKET SERVER      │
│  Express + Mongoose │            │  Socket.IO + KafkaJS   │
│  :4000              │            │  + ioredis   :5000     │
└────────┬────────────┘            └──────┬───────────┬─────┘
         │                  produce(msg)  │           │  publish('messages')
         │                                ▼           ▼
         │                        ┌──────────┐  ┌──────────────────┐
         │                        │  KAFKA   │  │     REDIS        │
         │                        │ messages │  │  Pub/Sub channels│
         │                        └────┬─────┘  └────────┬─────────┘
         │                             │ consume         │ subscribe
         │                             ▼                 ▼
         │                   ┌──────────────────┐  ┌──────────────────┐
         │                   │  PERSISTENCE     │  │  ALL WS SERVER   │
         │                   │  SERVICE         │  │  INSTANCES       │
         │                   │  Batch buffer    │  │  io.to(groupId)  │
         │                   └────────┬─────────┘  │  .emit(msg)      │
         │                            │            └────────┬─────────┘
         │                            ▼                     │
         │              ┌────────────────────────────┐      │ WebSocket
         └─────────────►│         MONGODB            │      ▼
                        │  users | groups | messages │    CLIENT
                        └────────────────────────────┘
```
 

### Message Flow (send → deliver → persist)

```
User types message
       │
       ▼
Socket.IO 'send-msg' event
       │
       ▼
Socket Server: produceMessage() → Kafka topic 'messages'
       │                                    │
       │                                    ▼
       │                         Persistence Service consumer
       │                         buffers message, batch-writes to MongoDB
       │
       ▼
Socket Server: redis.publish('messages', payload)
       │
       ▼
All Socket Server instances receive via subscriber.on('message')
       │
       ▼
io.to(groupId).emit('receive-msg') → all room members see the message
```

### Presence Flow

```
User connects to Socket Server
       │
       ▼
redis.sadd('online_users', userId)
redis.publish('presence', { type: 'USER_ONLINE', userId })
       │
       ▼
All Socket Server instances receive presence event
io.emit('user-online', userId) → all clients update UI
```

---

## Project Structure

```
Social-Sphere-scalable-main/
│
├── API server/                    # REST API service
│   ├── api routes/
│   │   ├── userRoutes.js          # /api/auth, /api/user
│   │   └── chatRoutes.js          # /api/chat
│   ├── config/
│   │   └── database.js            # Mongoose connection
│   ├── controllers/
│   │   ├── userController.js      # login, register, profile
│   │   └── chatController.js      # groups, messages, participants
│   ├── middlewares/
│   │   └── auth.js                # JWT cookie verification
│   ├── models/
│   │   ├── users.js
│   │   ├── groups.js
│   │   └── messages.js
│   └── server.js                  # Entry point
│
├── socket server/                 # WebSocket service
│   ├── config/
│   │   ├── redis.js               # Publisher + subscriber clients
│   │   └── kafka.js               # KafkaJS producer config
│   ├── handlers/
│   │   ├── index.js               # Registers all socket event handlers
│   │   ├── joinRoom.js            # 'join-chat-room' handler
│   │   └── sendMessage.js         # 'send-msg' handler
│   ├── kafka/
│   │   └── producer.js            # connectProducer, produceMessage
│   └── ws-server.js               # Entry point
│
├── persistence-service/           # Kafka→MongoDB consumer service
│   ├── db/
│   │   ├── connection.js          # Mongoose connect/disconnect
│   │   ├── messageRepository.js   # saveBatch, insertMessages, linkToGroups
│   │   └── models/
│   │       ├── groups.js
│   │       └── messages.js
│   ├── kafka/
│   │   └── consumer.js            # KafkaJS consumer config
│   └── service.js                 # Entry point, batch flush logic
│
└── client/                        # React frontend
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js                 # Routes + auth guard
        ├── apis.js                # Axios instance config
        ├── pages/
        │   ├── home.jsx           # Main chat UI (socket setup, state)
        │   ├── login.jsx
        │   ├── register.jsx
        │   └── notFound.jsx
        └── components/
            ├── SideBar.jsx
            ├── SearchBar.jsx
            ├── ChatList.jsx
            ├── ChatHeader.jsx
            ├── ChatContent.jsx
            ├── MessageInputBar.jsx
            ├── CreateGroupModal.jsx
            ├── JoinGroupModal.jsx
            ├── AddParticipantModal.jsx
            ├── ViewGroupModal.jsx
            ├── ProfileModal.jsx
            └── Loader.jsx
```

---


## Benchmark & Performance
 
Load testing was conducted using [k6](https://k6.io/) against a single-node deployment, simulating concurrent users sending messages across shared group chat rooms. The full pipeline — Client → Socket Server → Kafka → Redis Pub/Sub → Client — was exercised end-to-end in both runs.
 
### Baseline Scenario — 10 Concurrent Users
 
At a controlled load of 10 virtual users over 150 seconds, the system performed exceptionally well. **9,984 messages** were sent to the server, which with a 1:10 fan-out ratio resulted in **99,746 broadcast deliveries** — a **99.91% delivery success rate** with zero errors. Throughput held at a steady **664.94 messages/second**.
 
The end-to-end latency numbers tell the real story: an **average of 10.44ms** from send to receive, with **P95 at just 20ms**, meaning 95% of all messages across the entire test arrived in under 20 milliseconds. The maximum observed latency was 113ms, an outlier likely caused by a garbage collection pause or initial Kafka broker warm-up. These numbers confirm that the Kafka → Redis delivery path adds negligible overhead under normal load and comfortably achieves the sub-100ms target.
 
| Metric | Value |
|---|---|
| Throughput | 664.94 msg/s |
| Delivery Success Rate | **99.91%** |
| Average Latency | 10.44 ms |
| P95 Latency | 20.00 ms |
| Max Latency | 113.00 ms |
| Messages Sent | 9,984 |
| Messages Delivered | 99,746 |
 
### Load Scenario — 100 Concurrent Users
 
Scaling to 100 virtual users over 270 seconds revealed the throughput ceiling of a single-node deployment. The system processed **159,200 messages** and broadcast an enormous **6,981,453 deliveries**, sustaining a raw throughput of **25,857 messages/second** — a ~39× increase over baseline — which demonstrates that the Kafka pipeline and Redis fan-out scale well with message volume on a single node.
 
However, the 1:100 fan-out ratio (100 users per room receiving every message) generates ~15.9M expected delivery events. Under this pressure, the single socket server instance becomes the bottleneck — it cannot flush its internal broadcast queues fast enough, causing average latency to climb to **43.67 seconds** with P95 at **84.47 seconds**, and the overall delivery rate dropping to **43.85%**. Importantly, the error rate remained **0.00%** throughout — no crashes, no dropped connections — the system degraded gracefully under overload rather than failing hard.
 
This behaviour is expected and by design: the architecture supports horizontal scaling by adding more socket server instances behind a load balancer, with Redis Pub/Sub ensuring all instances receive and deliver messages regardless of which node a client is connected to (see [Scalability Design](#scalability-design)).
 
| Metric | Value |
|---|---|
| Throughput | 25,857.11 msg/s |
| Delivery Success Rate | 43.85% |
| Average Latency | 43,669.93 ms |
| P95 Latency | 84,466.00 ms |
| Max Latency | 86,480.00 ms |
| Messages Sent | 159,200 |
| Messages Delivered | 6,981,453 |
| Error Rate | **0.00%** |
 
---

## Prerequisites

Before running Social Sphere, ensure the following are installed and running:

| Dependency | Version | Notes |
|---|---|---|
| **Node.js** | ≥ 18.x | Required for all three Node services |
| **npm** | ≥ 9.x | Comes with Node.js |
| **MongoDB** | ≥ 6.x | Can run locally or use MongoDB Atlas |
| **Apache Kafka** | ≥ 3.x | Requires ZooKeeper or KRaft mode |
| **Redis** | ≥ 7.x | Must be running on the default port (6379) or configured via env |

### Kafka Topic Setup

Before starting any service, create the required Kafka topic:

```bash
# Using Kafka CLI (adjust bootstrap server as needed)
kafka-topics.sh --create \
  --topic messages \
  --bootstrap-server localhost:9092 \
  --partitions 4 \
  --replication-factor 1
```

---

## Setup & Installation

Clone the repository and install dependencies for each service independently.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Social-Sphere-scalable.git
cd Social-Sphere-scalable
```

### 2. API Server

```bash
cd "API server"
npm install
```

Create a `.env` file in `API server/`:

```env
PORT=4000
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb://localhost:27017/social-sphere
JWT_SECRET_KEY=your_super_secret_jwt_key
NODE_ENV=development
```

Start the API server:

```bash
npm run dev    # development (nodemon)
npm start      # production
```

### 3. Socket Server

```bash
cd "socket server"
npm install
```

Create a `.env` file in `socket server/`:

```env
WS_PORT=5000
CLIENT_URL=http://localhost:3000
JWT_SECRET_KEY=your_super_secret_jwt_key
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=socket-server
```

Start the socket server:

```bash
npm run dev    # development (nodemon)
npm start      # production
```

### 4. Persistence Service

```bash
cd persistence-service
npm install
```

Create a `.env` file in `persistence-service/`:

```env
MONGO_URI=mongodb://localhost:27017/social-sphere
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=persistence-service
KAFKA_GROUP_ID=persistence-group
BATCH_SIZE=50
FLUSH_INTERVAL_MS=2000
```

Start the persistence service:

```bash
npm run dev    # development (nodemon)
npm start      # production
```

### 5. React Client

```bash
cd client
npm install
```

Create a `.env` file in `client/`:

```env
REACT_APP_API_URL=http://localhost:4000
REACT_APP_SOCKET_SERVER_URL=http://localhost:5000
```

Start the React development server:

```bash
npm start      # development (http://localhost:3000)
npm run build  # production build
```

### Running All Services Together

Open four terminal windows and start each service in order:

```
Terminal 1: cd "API server"         && npm run dev
Terminal 2: cd "socket server"      && npm run dev
Terminal 3: cd "persistence-service"&& npm run dev
Terminal 4: cd client               && npm start
```

Ensure MongoDB, Kafka, and Redis are all running before starting any Node service.

---

## Environment Variables

### API Server

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | HTTP port |
| `CLIENT_URL` | `*` | Allowed CORS origin |
| `MONGO_URI` | — | MongoDB connection string |
| `JWT_SECRET_KEY` | — | Secret for JWT signing/verification |
| `NODE_ENV` | `development` | Controls cookie `secure` and `sameSite` flags |

### Socket Server

| Variable | Default | Description |
|---|---|---|
| `WS_PORT` | `5000` | WebSocket server port |
| `CLIENT_URL` | — | Allowed CORS origin for Socket.IO |
| `JWT_SECRET_KEY` | — | Must match API server's secret |
| `REDIS_HOST` | `127.0.0.1` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `KAFKA_BROKERS` | `localhost:9092` | Comma-separated Kafka broker list |
| `KAFKA_CLIENT_ID` | `socket-server` | Kafka producer client ID |

### Persistence Service

| Variable | Default | Description |
|---|---|---|
| `MONGO_URI` | — | MongoDB connection string |
| `KAFKA_BROKERS` | `localhost:9092` | Comma-separated Kafka broker list |
| `KAFKA_CLIENT_ID` | `persistence-service` | Kafka consumer client ID |
| `KAFKA_GROUP_ID` | `persistence-group` | Kafka consumer group |
| `BATCH_SIZE` | `50` | Flush buffer when this many messages accumulate |
| `FLUSH_INTERVAL_MS` | `2000` | Flush buffer after this many milliseconds |

---

## API Reference

### Auth Routes (`/api/auth`)

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | `{ username, password }` | Login; sets JWT cookie |
| `POST` | `/api/auth/register` | `{ name, username, password }` | Register a new user |

### User Routes (`/api/user`) — requires auth

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/profile` | Fetch current user profile |
| `PUT` | `/api/user/profile` | Update display name |

### Chat Routes (`/api/chat`) — requires auth

| Method | Endpoint | Params / Body | Description |
|---|---|---|---|
| `GET` | `/api/chat/conversations` | — | List user's groups, sorted by last activity |
| `GET` | `/api/chat/messages` | `?groupId&page&limit` | Paginated message history |
| `GET` | `/api/chat/search` | `?searchQuery` | Search users by username prefix |
| `POST` | `/api/chat/create-group` | `{ groupName }` | Create a new group |
| `POST` | `/api/chat/join-group` | `{ groupId }` | Submit join request |
| `POST` | `/api/chat/add-participant` | `{ username, groupId }` | Admin: add a user directly |
| `GET` | `/api/chat/group` | `?group_id` | Fetch group metadata |
| `GET` | `/api/chat/join-request-response` | `?group_id&acceptStatus&username` | Admin: accept/deny join request |
| `GET` | `/api/chat/leave-group` | `?group_id` | Leave a group |
| `GET` | `/api/chat/remove-participant` | `?groupId&username` | Admin: remove a participant |

### WebSocket Events

**Client → Server**

| Event | Payload | Description |
|---|---|---|
| `join-chat-room` | `{ groupId }` | Join the Socket.IO room for a group |
| `send-msg` | `{ groupId, content }` | Send a message to a group |

**Server → Client**

| Event | Payload | Description |
|---|---|---|
| `set-username` | `userId` | Server confirms your identity after auth |
| `online-users` | `string[]` | Full snapshot of online users on connect |
| `user-online` | `userId` | A user came online |
| `user-offline` | `userId` | A user went offline |
| `receive-msg` | `{ groupId, sender, message }` | Incoming message for a group |
| `msg-error` | `{ error }` | Message delivery failure |

---

## Scalability Design

Social Sphere's architecture is built to scale horizontally with minimal configuration changes:

**Scale out socket servers**: Run N instances behind a load balancer (e.g. NGINX). Since all socket servers subscribe to the same Redis `messages` and `presence` channels, every instance delivers messages to its own connected clients without coordination. No sticky sessions required.

**Scale out persistence workers**: Run N instances of the persistence service. Kafka automatically distributes topic partitions across consumer group members. More instances = more parallel write throughput. The `persistence-group` consumer group ensures each Kafka message is processed exactly once.

**Database sharding**: MongoDB collections can be sharded on `group_id` (groups/messages) or `username` (users) for write-heavy workloads.

**Kafka replication**: Increase `replication-factor` and `partitions` on the `messages` topic for fault tolerance and higher throughput respectively.
