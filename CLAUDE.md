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
pip install selenium pytest pytest-html webdriver-manager requests

# Run all automated tests
python tests/run_tests.py

# Run specific test categories
python tests/run_tests.py --test tests/selenium_tests/test_chat_widget.py
python tests/run_tests.py --test tests/selenium_tests/test_admin_interface.py
python tests/run_tests.py --test tests/selenium_tests/test_channel_isolation.py

# Run tests in parallel (faster)
python tests/run_tests.py --parallel

# Test embedding widget
# Start HTTP server for widget testing:
node serve-test.js

# Open in browser: http://localhost:5500/test-embedding.html

# Run dual-window messaging tests
python3 tests/test_dual_window_messaging.py
python3 tests/test_realtime_sync.py

# Verify Chrome testing setup
python3 test_chrome_verification.py
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

## Chrome Testing Setup

### ChromeDriver Installation and Configuration

This project uses **Selenium WebDriver with ChromeDriver** for automated browser testing. Follow these steps to set up Chrome testing:

#### **1. Install ChromeDriver (ARM64 Mac)**
```bash
# Method 1: Homebrew (Recommended)
brew install --cask chromedriver

# Method 2: Manual Installation (if Homebrew fails)
# Download ChromeDriver matching your Chrome version from:
# https://googlechromelabs.github.io/chrome-for-testing/
# For Chrome 138.0.7204.158, use ChromeDriver 138.0.7204.157
curl -L -o chromedriver-mac-arm64.zip "https://storage.googleapis.com/chrome-for-testing-public/138.0.7204.157/mac-arm64/chromedriver-mac-arm64.zip"
unzip chromedriver-mac-arm64.zip
sudo cp chromedriver-mac-arm64/chromedriver /opt/homebrew/bin/chromedriver
chmod +x /opt/homebrew/bin/chromedriver
```

#### **2. Verify Installation**
```bash
# Check Chrome version
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version

# Check ChromeDriver version
chromedriver --version

# Run comprehensive verification
python3 test_chrome_verification.py
```

#### **3. ChromeDriver Paths Configuration**
The testing framework automatically detects ChromeDriver from these locations:
- `/opt/homebrew/bin/chromedriver` (Homebrew ARM64 - **Recommended**)
- `/usr/local/bin/chromedriver` (Intel Homebrew)
- `/usr/bin/chromedriver` (System install)

### **Selenium Test Configuration**

#### **Chrome Options Used**
```python
chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--disable-web-security')
chrome_options.add_argument('--allow-running-insecure-content')
chrome_options.add_argument('--window-size=1200,800')
```

#### **Dual Browser Setup**
For dual-window messaging tests, the framework creates two Chrome instances:
```python
# Widget browser (user side)
widget_driver = webdriver.Chrome(service=service1, options=chrome_options)
widget_driver.set_window_position(0, 0)

# Admin browser (admin side)  
admin_driver = webdriver.Chrome(service=service2, options=chrome_options)
admin_driver.set_window_position(600, 0)
```

### **Running Chrome Tests**

#### **Prerequisites**
```bash
# Ensure all services are running
docker-compose up -d                    # PostgreSQL database
npm run dev:server                      # Chat server (port 3001)
npm run dev:admin                       # Admin interface (port 3000)
node serve-test.js                      # Test HTTP server (port 5500)
```

#### **Test Execution Commands**
```bash
# Verify Chrome testing environment
python3 test_chrome_verification.py

# Run dual-window messaging tests
python3 tests/test_dual_window_messaging.py

# Run real-time synchronization tests  
python3 tests/test_realtime_sync.py

# Run comprehensive test suite
python3 run_dual_window_tests.py
```

### **Troubleshooting Chrome Testing**

#### **Common Issues and Fixes**

**1. ChromeDriver Architecture Mismatch**
```bash
# Error: [Errno 8] Exec format error
# Fix: Download ARM64 ChromeDriver for Apple Silicon Macs
curl -L -o chromedriver-mac-arm64.zip "https://storage.googleapis.com/chrome-for-testing-public/138.0.7204.157/mac-arm64/chromedriver-mac-arm64.zip"
unzip chromedriver-mac-arm64.zip
cp chromedriver-mac-arm64/chromedriver /opt/homebrew/bin/chromedriver
```

**2. ChromeDriver Version Mismatch**
```bash
# Check versions
google-chrome --version
chromedriver --version

# Install matching ChromeDriver version
# Chrome 138.x.x.x requires ChromeDriver 138.x.x.x
```

**3. Permission Denied**
```bash
# Fix executable permissions
chmod +x /opt/homebrew/bin/chromedriver

# Verify ChromeDriver is executable
chromedriver --version
```

**4. Selenium Import Issues**
```bash
# Install required packages
pip3 install selenium pytest pytest-html webdriver-manager requests

# If there's a naming conflict with local 'selenium' directory:
# Rename tests/selenium to tests/selenium_tests
```

**5. Widget Loading Failures**
```bash
# Ensure test server is running
node serve-test.js

# Check server is accessible
curl http://localhost:5500/test-embedding.html

# Verify backend services
curl http://localhost:3001/api/conversations
curl http://localhost:3000/
```

### **Chrome Testing Architecture**

#### **Test Files Structure**
- `tests/test_dual_window_messaging.py` - **Main dual-browser tests**
- `tests/test_realtime_sync.py` - Real-time synchronization tests  
- `test_chrome_verification.py` - **Chrome environment verification**
- `run_dual_window_tests.py` - **Test orchestration and reporting**

#### **Key Testing Features**
- ✅ **Dual Browser Automation** - Widget and admin simultaneously
- ✅ **Real-time Message Exchange** - Bidirectional communication testing
- ✅ **Connection Status Validation** - WebSocket and API connectivity
- ✅ **Error Recovery Testing** - Network failure simulation and recovery
- ✅ **Multi-user Scenarios** - User switching and isolation testing
- ✅ **Screenshot Capture** - Visual debugging and test evidence
- ✅ **Performance Timing** - Message latency and response time measurement

#### **Chrome Test Results Location**
```
test-results/
├── screenshots/           # Test execution screenshots
├── chrome_verification_report.html    # Chrome setup verification
├── dual_window_report.html           # Dual-window test results
└── logs/                            # Detailed test execution logs
```

### **Version Compatibility Matrix**

| Chrome Version | ChromeDriver Version | Status | Notes |
|---------------|---------------------|---------|-------|
| 138.0.7204.158 | 138.0.7204.157 | ✅ Compatible | **Currently Used** |
| 137.x.x.x | 137.x.x.x | ✅ Compatible | Previous stable |
| 136.x.x.x | 136.x.x.x | ✅ Compatible | Older stable |

#### **Upgrade Procedure**
When Chrome auto-updates:
1. Check new Chrome version: `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version`
2. Download matching ChromeDriver from: https://googlechromelabs.github.io/chrome-for-testing/
3. Replace existing ChromeDriver: `cp new-chromedriver /opt/homebrew/bin/chromedriver`
4. Verify compatibility: `python3 test_chrome_verification.py`

### **Chrome Testing Best Practices**
- Always run `test_chrome_verification.py` after ChromeDriver updates
- Use screenshots for debugging test failures: `self.take_screenshot(driver, "debug_name")`
- Monitor test execution in real-time with visible browser windows
- Check test-results/ directory for detailed logs and reports after test runs
- Ensure all required services are running before executing Chrome tests