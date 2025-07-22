# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Initial Setup
```bash
# Start PostgreSQL database
docker-compose up -d

# Install dependencies for all packages
npm install
npm run install:all
```

### Running Services
```bash
# Start chat server (port 3001)
npm run dev:server

# Start admin interface (port 3000)  
npm run dev:admin

# Start widget development (port 5173)
npm run dev:widget
```

### Testing
```bash
# Install Python testing dependencies
pip install -r tests/requirements.txt

# Run all automated tests
python tests/run_tests.py

# Run specific test categories
python tests/run_tests.py --test tests/selenium/test_chat_widget.py
python tests/run_tests.py --test tests/selenium/test_admin_interface.py
python tests/run_tests.py --test tests/selenium/test_channel_isolation.py

# Run tests in parallel (faster)
python tests/run_tests.py --parallel

# Test embedding widget
# Open test-embedding.html in browser after starting HTTP server:
python -m http.server 5500
```

### Building
```bash
# Build all packages for production
npm run build:all
```

## Architecture Overview

This is a **real-time chat system** built as a monorepo with 3 main packages:

### Core Components
- **`packages/chat-server/`** - Express.js + Socket.IO backend (TypeScript)
- **`packages/chat-admin/`** - React admin dashboard with Facebook Messenger-style UI
- **`packages/chat-widget/`** - Embeddable React chat widget (UMD/ES modules)

### Database Layer
- **PostgreSQL** with UUID-based schema (`database/init.sql`)
- Tables: `users`, `conversations`, `messages`
- Database connection managed through `packages/chat-server/src/database.ts`

### Real-Time Communication
- **Socket.IO** for bidirectional messaging between users and admins
- **Message isolation system** - each user conversation is isolated from others
- **Push notifications** with Service Workers and VAPID keys

## Critical Implementation Details

### Message Isolation Fix
The admin interface includes a **critical fix** for real-time message contamination:

**Location:** `packages/chat-admin/src/App.tsx` lines ~110-127
```typescript
socket.on('new-user-message', (message: Message & { userEmail: string }) => {
  const currentSelectedConversation = selectedConversationRef.current;
  
  // Only add to main chat window if message belongs to currently selected conversation
  if (message.conversation_id === currentSelectedConversation) {
    setMessages(prev => [...prev, message]);
  }
  // Always update sidebar regardless
  setConversations(prev => { /* update logic */ });
});
```

**Key Issue:** Without this filtering, messages from User B would incorrectly appear in User A's chat window when admin has User A selected.

**React Pattern:** Uses `selectedConversationRef.current` instead of `selectedConversation` state to avoid stale closure problems in Socket.IO event handlers.

### Socket.IO Event System

**User Events:**
- `join-user` - User connects with email
- `user-message` - User sends message  
- `user-typing` / `user-stopped-typing` - Typing indicators

**Admin Events:**  
- `join-admin` - Admin connects to dashboard
- `admin-message` - Admin replies to user
- `admin-broadcast` - Admin sends to all users
- `admin-typing` / `admin-stopped-typing` - Admin typing

### Database Patterns
- **User identification** by email (no authentication system)
- **Conversation mapping** via `conversation_id` UUID
- **Message persistence** with sender type (`user` | `admin`)
- **Connection tracking** in memory maps (`userConnections`, `adminConnections`)

## Testing Architecture

### Test Categories
- **`test_chat_widget.py`** - Widget functionality, connection states, UI responsiveness
- **`test_admin_interface.py`** - Admin dashboard, message handling, broadcasts  
- **`test_channel_isolation.py`** - **Critical:** Message isolation between conversations
- **`test_integration.py`** - End-to-end user ↔ admin message flows

### Key Test: Message Isolation
**Location:** `tests/selenium/test_channel_isolation.py`

This test validates the fix for real-time message contamination by:
1. Opening admin with User A conversation selected
2. Sending message from User B 
3. Verifying User B's message does NOT appear in User A's chat window
4. Confirming User B's message appears only in User B's conversation

**Test Files for Debugging:**
- `debug_contamination_bug.py` - Detailed contamination testing
- `two_browser_reproduction.py` - Multi-browser testing
- `test_exact_user_scenario.py` - Specific scenario reproduction

## Environment Configuration

### Server Environment (.env in packages/chat-server/)
```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chat_system
DB_USER=chat_user
DB_PASSWORD=chat_password
```

### Push Notifications
- **VAPID keys** configured in server (`packages/chat-server/src/index.ts`)
- **Service Worker** at `packages/chat-admin/public/sw.js`
- **NotificationService** handles browser notifications

## Widget Integration

### Basic Usage
```jsx
import { ChatWidget } from 'chat-widget';

<ChatWidget 
  email="user@example.com"
  serverUrl="http://localhost:3001"
  primaryColor="#007bff"
  position="bottom-right"
/>
```

### Testing Widget
Use `test-embedding.html` which provides:
- User switching (User 1 / User 2 buttons)  
- Real-time connection testing
- Message sending capabilities

## Development Notes

### Common Issues
1. **Port conflicts** - Server (3001), Admin (3000), Widget dev (5173)
2. **Database connection** - Ensure PostgreSQL is running via docker-compose
3. **Message contamination** - Always test with multiple users and conversation switching
4. **Socket connection state** - Admin interface uses refs to avoid stale closure issues

### Performance Considerations
- Messages load incrementally per conversation
- Connection pooling for database queries  
- Real-time updates optimized for conversation-specific filtering
- Service Worker caching for admin interface

### Testing Best Practices
- Always run `test_channel_isolation.py` when modifying message handling
- Use browser debugging versions of tests for visual verification
- Check test screenshots in `test-results/screenshots/` for failures
- Comprehensive test logs available in `test-results/logs/`

This chat system implements Facebook Messenger-style real-time communication with robust message isolation and comprehensive testing coverage.