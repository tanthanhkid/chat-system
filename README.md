# Chat System MVP

A real-time chat system with embeddable React widget and admin interface.

## Features

- **Embeddable Chat Widget**: React component that can be embedded into any website
- **Admin Dashboard**: Web interface for admins to view conversations and respond to users
- **Real-time Communication**: Socket.IO for instant messaging
- **Message Persistence**: PostgreSQL database for storing conversations and messages
- **User Identification**: Simple email-based user identification
- **Broadcast Messages**: Admin can send messages to all users at once

## Architecture

```
├── packages/
│   ├── chat-widget/     # Embeddable React component
│   ├── chat-admin/      # Admin web interface  
│   └── chat-server/     # Backend server (Express + Socket.IO)
├── database/            # PostgreSQL schema
└── docker-compose.yml   # Database setup
```

## Quick Start

### 1. Start the Database

```bash
docker-compose up -d
```

### 2. Install Dependencies

```bash
npm install
npm run install:all
```

### 3. Start the Server

```bash
npm run dev:server
```

### 4. Start the Admin Interface

```bash
npm run dev:admin
```

### 5. Test the Widget

Open `test-embedding.html` in your browser to see the chat widget in action.

## Usage

### Embedding the Chat Widget

```jsx
import { ChatWidget } from 'chat-widget';

function App() {
  return (
    <div>
      <h1>My Website</h1>
      <ChatWidget 
        email="user@example.com"
        serverUrl="http://localhost:3001"
        primaryColor="#007bff"
        position="bottom-right"
      />
    </div>
  );
}
```

### Widget Props

- `email` (required): User's email address for identification
- `serverUrl` (optional): Backend server URL (default: http://localhost:3001)
- `primaryColor` (optional): Primary color for the widget (default: #007bff)
- `position` (optional): Position of the chat bubble (default: bottom-right)

### Admin Interface

1. Open http://localhost:3000
2. View all active conversations in the sidebar
3. Click on a conversation to view message history
4. Reply to users or send broadcast messages to all users

## Development

### Project Structure

- **chat-server**: Express.js server with Socket.IO for real-time communication
- **chat-widget**: React component library for embedding
- **chat-admin**: React web application for admin interface

### Database Schema

- `users`: Store user information (email-based)
- `conversations`: Track conversations between users and admin
- `messages`: Store all chat messages with sender information

### Socket Events

**User Events:**
- `join-user`: User joins with email
- `user-message`: User sends a message

**Admin Events:**
- `join-admin`: Admin connects to dashboard
- `admin-message`: Admin replies to user
- `admin-broadcast`: Admin sends message to all users

## Environment Variables

Create `.env` file in `packages/chat-server/`:

```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chat_system
DB_USER=chat_user
DB_PASSWORD=chat_password
```

## Building for Production

```bash
npm run build:all
```

This builds:
- Chat widget as UMD/ES modules for distribution
- Admin interface as static files
- Server TypeScript to JavaScript

## Docker

The PostgreSQL database runs in Docker. To stop:

```bash
docker-compose down
```

To reset the database:

```bash
docker-compose down -v
docker-compose up -d
```