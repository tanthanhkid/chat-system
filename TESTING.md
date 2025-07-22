# Chat System Testing Guide

This document provides comprehensive instructions for running automated tests on the chat system.

## 🚀 Quick Start

### Prerequisites
1. **Node.js** (v16+) and **npm**
2. **Python 3.8+** and **pip**
3. **Docker** (for PostgreSQL database)
4. **Chrome browser** (for Selenium tests)

### 1. Setup Services

```bash
# 1. Start the database
docker-compose up -d

# 2. Install Node.js dependencies
npm install
npm run install:all

# 3. Start the chat server (Terminal 1)
npm run dev:server

# 4. Start the admin interface (Terminal 2)  
npm run dev:admin
```

### 2. Install Test Dependencies

```bash
# Install Python testing dependencies
pip install -r tests/requirements.txt
```

### 3. Run Tests

```bash
# Run all tests
python tests/run_tests.py

# Run specific test categories
python tests/run_tests.py --test tests/selenium/test_chat_widget.py
python tests/run_tests.py --test tests/selenium/test_admin_interface.py
python tests/run_tests.py --test tests/selenium/test_integration.py

# Run tests in parallel (faster)
python tests/run_tests.py --parallel

# Just check if system is ready
python tests/run_tests.py --check-only
```

## 📊 Test Results

After running tests, results are saved in `/test-results/`:

- **`reports/`** - HTML and JUnit XML reports
- **`screenshots/`** - Automatically captured screenshots
- **`logs/`** - Detailed test execution logs

## 🧪 Test Categories

### 1. Chat Widget Tests (`test_chat_widget.py`)
- ✅ Widget button visibility and positioning
- ✅ Chat window toggle functionality
- ✅ Connection status indicators
- ✅ Message input and sending
- ✅ User switching functionality
- ✅ Responsive design at different screen sizes
- ✅ Error handling and retry mechanisms

### 2. Admin Interface Tests (`test_admin_interface.py`)
- ✅ Admin dashboard loading and layout
- ✅ Connection status display and retry
- ✅ Broadcast message functionality
- ✅ Conversations list and selection
- ✅ Message reply functionality
- ✅ Online user status indicators
- ✅ Responsive design testing
- ✅ Performance metrics

### 3. Integration Tests (`test_integration.py`)
- ✅ End-to-end message flow (user ↔ admin)
- ✅ Broadcast message delivery to multiple users
- ✅ Connection recovery after network interruption
- ✅ Multiple concurrent users scenarios

## 🔧 Socket Connection Fixes Applied

The tests validate that the following connection issues have been resolved:

### Chat Widget Improvements:
- **Automatic Reconnection**: Widget now automatically attempts to reconnect when connection is lost
- **Connection Status**: Clear visual indicators show Online/Connecting/Error states
- **Retry Mechanism**: Users can manually retry failed connections
- **Error Handling**: Graceful degradation when server is unavailable
- **Reconnection Logic**: Configurable retry attempts with exponential backoff

### Admin Interface Improvements:
- **Connection Monitoring**: Real-time connection status in header
- **Retry Functionality**: Manual retry button for failed connections
- **Offline Handling**: Admin can still view cached conversations when offline
- **Error Recovery**: Automatic reconnection attempts with user feedback

### Server Improvements:
- **Enhanced Socket Configuration**: Better timeout and ping settings
- **Connection Validation**: Proper error handling for client connections
- **Graceful Disconnection**: Clean handling of client disconnects

## 📋 Test Scenarios Covered

### Connection Scenarios:
- ✅ Normal connection establishment
- ✅ Connection failure handling
- ✅ Network interruption recovery
- ✅ Server restart recovery
- ✅ Multiple reconnection attempts

### Messaging Scenarios:
- ✅ User to admin messages
- ✅ Admin to user replies
- ✅ Broadcast messages to all users
- ✅ Message persistence
- ✅ Real-time delivery

### UI/UX Scenarios:
- ✅ Widget responsiveness (desktop, tablet, mobile)
- ✅ Admin dashboard functionality
- ✅ Error state handling
- ✅ Loading states
- ✅ User feedback mechanisms

### Multi-user Scenarios:
- ✅ Multiple users connecting simultaneously
- ✅ Concurrent message sending
- ✅ Broadcast delivery to all active users
- ✅ User online/offline status tracking

## 🐛 Troubleshooting

### Tests Fail to Start
```bash
# Check if services are running
curl http://localhost:3001/api/conversations
curl http://localhost:3000

# Restart services if needed
docker-compose restart
npm run dev:server
npm run dev:admin
```

### Connection Errors in Tests
- Ensure all services are running on correct ports
- Check firewall settings
- Verify no other applications are using ports 3000/3001

### Screenshot/Report Issues
- Ensure Chrome browser is installed
- Check write permissions in test-results directory
- Try running with `--parallel` flag disabled

### Python Dependency Issues
```bash
# Create virtual environment (recommended)
python -m venv test-env
source test-env/bin/activate  # On Windows: test-env\Scripts\activate
pip install -r tests/requirements.txt
```

## 📈 Performance Expectations

Based on test execution:

- **Page Load Time**: < 5 seconds
- **Message Delivery**: < 2 seconds
- **Connection Establishment**: < 10 seconds
- **UI Responsiveness**: < 1 second for interactions

## 🚀 CI/CD Integration

To integrate with CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Run Chat System Tests
  run: |
    docker-compose up -d
    npm run dev:server &
    npm run dev:admin &
    sleep 10  # Wait for services
    python tests/run_tests.py
    docker-compose down
```

## 🔍 Debugging Tests

For debugging failed tests:

1. **Check Screenshots**: Automatically captured in `test-results/screenshots/`
2. **Review Logs**: Detailed logs in `test-results/logs/`
3. **Run Single Test**: Use `--test` flag to run specific tests
4. **Browser Debugging**: Modify test to run with `--headless=false` for visual debugging

## 📞 Support

If tests continue to fail after following this guide:

1. Check the generated HTML reports for detailed failure information
2. Review console logs in the browser screenshots
3. Verify all socket connection improvements are working as expected
4. Ensure database schema is properly initialized

The test suite is designed to validate that all identified socket connection issues have been resolved and the system is working reliably for production use.