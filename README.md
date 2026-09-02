# 🚀 Real-Time Chat & Messaging Platform (Spring Boot & MySQL)

A high-performance real-time chat application built with **Spring Boot 3.5.x**, **Java 21 (Virtual Threads)**, **Spring WebSocket (STOMP)**, **MySQL & JPA**, **JWT Security**, and a modern **Angular Standalone** frontend.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Angular Standalone Client                   │
│         (@stomp/stompjs, SockJS, Signals, Guards, DI)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ WSS / STOMP
                               ▼
  ┌───────────────────────────────────────────────────────────┐
  │                 Spring Boot 3.5 Backend                   │
  │  - Virtual Threads Enabled (`spring.threads.virtual.enabled`)
  │  - STOMP Broker (`/topic`, `/queue`, `/app`, `/user`)     │
  │  - JWT Handshake & Channel Subscription Interceptors      │
  │  - Presence & Heartbeat Engine                            │
  └────────────────────────────┬──────────────────────────────┘
                               │ JDBC / JPA
                               ▼
  ┌───────────────────────────────────────────────────────────┐
  │                         MySQL                             │
  │  - Users & Presence Status (`is_online`, `last_seen`)     │
  │  - Group & 1:1 Direct Chat Rooms                          │
  │  - Room Members & Roles                                   │
  │  - Persisted Message History                              │
  └───────────────────────────────────────────────────────────┘
```

---

## 🧠 Core Engineering Features

### 1. STOMP over Raw WebSockets
Spring's STOMP broker abstraction provides:
- Named destination routing (`/topic/*`, `/queue/*`, `/app/*`)
- Built-in user-destination resolution for direct messages (`/user/queue/private`)
- Standardized heartbeat negotiation and session lifecycle events

### 2. MySQL Persistence & Presence Tracking
- All user profiles, chat rooms, memberships, and message histories are persisted directly in **MySQL**.
- **Presence Tracking**: Users' active status (`is_online`, `last_seen`) is tracked directly in MySQL and synchronized via STOMP broadcasts on `/topic/presence`.

### 3. Concurrency with Java 21 Virtual Threads
- Enabled with `spring.threads.virtual.enabled=true`.
- Each incoming request and WebSocket connection runs on a lightweight virtual thread.

### 4. Multi-Layered Security & Authorization
- **Handshake Authentication**: `JwtHandshakeInterceptor` extracts and verifies the HMAC-SHA256 JWT during the WebSocket upgrade handshake.
- **Subscription Authorization**: `TopicSubscriptionInterceptor` implements `ChannelInterceptor`. On every STOMP `SUBSCRIBE` frame to `/topic/room.{roomId}`, it verifies that the connected user is a valid member of that room before allowing subscription.

---

## 📡 STOMP Destinations Reference

| Destination | Direction | Payload | Purpose |
|---|---|---|---|
| `/app/chat.send` | Client → Server | `ChatMessageDto` | Send message to a group or direct room |
| `/app/chat.private` | Client → Server | `ChatMessageDto` | Send 1:1 direct message to recipient |
| `/app/chat.typing` | Client → Server | `TypingEventDto` | Publish ephemeral typing indicator |
| `/app/presence.heartbeat`| Client → Server | `{}` | Refresh active presence heartbeat |
| `/topic/room.{roomId}` | Server → Clients | `ChatMessageDto` | Real-time broadcast of room messages |
| `/user/queue/private` | Server → Client | `ChatMessageDto` | Private direct message delivered to user |
| `/topic/room.{roomId}.typing` | Server → Clients | `TypingEventDto` | Real-time typing notification |
| `/topic/presence` | Server → Clients | `PresenceDto` | Real-time online/offline status changes |

---

## 🌐 REST API Reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `GET` | `/api/rooms` | List rooms current user is a member of |
| `GET` | `/api/rooms/public` | List all public group chat channels |
| `POST` | `/api/rooms` | Create a new group channel |
| `POST` | `/api/rooms/direct/{targetUserId}` | Get or create 1:1 direct message room |
| `POST` | `/api/rooms/{id}/join` | Join a public group channel |
| `GET` | `/api/rooms/{id}/messages?page=0&size=40` | Paginated message history from MySQL |
| `POST` | `/api/presence/heartbeat` | Send presence heartbeat |
| `POST` | `/api/presence/batch` | Batch query online status for list of user IDs |
| `GET` | `/api/users?q=` | Search registered users by username |

---

## 🚀 How to Run Locally

### 1. Configure MySQL
Make sure MySQL is running locally on port `3306`.
The application automatically creates the database `chatdb` if it doesn't exist (`createDatabaseIfNotExist=true`).
If your MySQL password is not blank, you can set it in `backend/src/main/resources/application.yml` or run with:
```bash
set SPRING_DATASOURCE_PASSWORD=your_password
```

### 2. Run Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
*(Or run `ChatApplication.java` directly in IntelliJ / VS Code / Antigravity IDE)*
The backend starts on `http://localhost:8080`.

### 3. Run Frontend (Angular)
```bash
cd frontend
npm start
```
The frontend starts on `http://localhost:4200`.
