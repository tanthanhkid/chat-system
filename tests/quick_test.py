#!/usr/bin/env python3
"""
Quick smoke test to validate chat system functionality without Selenium
Tests the API endpoints and socket connection improvements
"""

import requests
import json
import time
from datetime import datetime

class QuickTester:
    def __init__(self):
        self.server_url = "http://localhost:3001"
        self.admin_url = "http://localhost:3000"
        self.test_results = []
        
    def log_result(self, test_name, passed, details=""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def test_server_api(self):
        """Test server API endpoints"""
        print("\n🔌 Testing Server API...")
        
        try:
            # Test conversations endpoint
            response = requests.get(f"{self.server_url}/api/conversations", timeout=5)
            if response.status_code == 200:
                conversations = response.json()
                self.log_result("Server API - Conversations", True, f"Found {len(conversations)} conversations")
            else:
                self.log_result("Server API - Conversations", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("Server API - Conversations", False, str(e))
        
        # Test CORS headers
        try:
            response = requests.options(f"{self.server_url}/api/conversations", timeout=5)
            cors_header = response.headers.get('Access-Control-Allow-Origin')
            if cors_header:
                self.log_result("CORS Configuration", True, f"CORS header: {cors_header}")
            else:
                self.log_result("CORS Configuration", False, "No CORS headers found")
        except Exception as e:
            self.log_result("CORS Configuration", False, str(e))
    
    def test_admin_interface(self):
        """Test admin interface availability"""
        print("\n🖥️ Testing Admin Interface...")
        
        try:
            response = requests.get(self.admin_url, timeout=5)
            if response.status_code == 200:
                content = response.text
                # Check for key admin interface elements
                if "Chat Admin Dashboard" in content:
                    self.log_result("Admin Interface - Content", True, "Dashboard title found")
                else:
                    self.log_result("Admin Interface - Content", False, "Dashboard title missing")
                
                # Check for React app mounting point
                if 'id="root"' in content:
                    self.log_result("Admin Interface - React Mount", True, "React root element found")
                else:
                    self.log_result("Admin Interface - React Mount", False, "React root element missing")
            else:
                self.log_result("Admin Interface - Availability", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("Admin Interface - Availability", False, str(e))
    
    def test_test_page(self):
        """Test that the test HTML page exists and has correct content"""
        print("\n📄 Testing Widget Test Page...")
        
        try:
            with open("test-embedding.html", "r") as f:
                content = f.read()
                
                # Check for essential elements
                checks = [
                    ("Chat Widget Container", 'id="chat-widget-container"' in content),
                    ("React CDN", "react" in content.lower()),
                    ("Socket.IO CDN", "socket.io" in content.lower()),
                    ("User Switch Buttons", "email-inputs" in content),
                    ("Test Instructions", "Instructions:" in content)
                ]
                
                for check_name, condition in checks:
                    self.log_result(f"Test Page - {check_name}", condition)
                    
        except FileNotFoundError:
            self.log_result("Test Page - Existence", False, "test-embedding.html not found")
        except Exception as e:
            self.log_result("Test Page - Content", False, str(e))
    
    def test_socket_connection_improvements(self):
        """Test that socket connection improvements are in place"""
        print("\n🔌 Validating Socket Connection Fixes...")
        
        # Check chat widget improvements
        try:
            with open("packages/chat-widget/src/ChatWidget.tsx", "r") as f:
                widget_content = f.read()
                
                improvements = [
                    ("Automatic Reconnection", "reconnection: true" in widget_content),
                    ("Reconnection Attempts", "reconnectionAttempts" in widget_content),
                    ("Connection Error Handling", "connect_error" in widget_content),
                    ("Retry Functionality", "retryConnection" in widget_content),
                    ("Connection Status Display", "getConnectionStatus" in widget_content),
                    ("Test IDs for Automation", "data-testid" in widget_content)
                ]
                
                for improvement, found in improvements:
                    self.log_result(f"Widget - {improvement}", found)
                    
        except Exception as e:
            self.log_result("Widget - Code Analysis", False, str(e))
        
        # Check admin interface improvements
        try:
            with open("packages/chat-admin/src/App.tsx", "r") as f:
                admin_content = f.read()
                
                improvements = [
                    ("Admin Reconnection Logic", "reconnection: true" in admin_content),
                    ("Connection Error Handling", "connect_error" in admin_content),
                    ("Retry Button", "retryConnection" in admin_content),
                    ("Connection Status Header", "connection-status" in admin_content),
                    ("Test IDs for Automation", "data-testid" in admin_content)
                ]
                
                for improvement, found in improvements:
                    self.log_result(f"Admin - {improvement}", found)
                    
        except Exception as e:
            self.log_result("Admin - Code Analysis", False, str(e))
        
        # Check server improvements
        try:
            with open("packages/chat-server/src/index.ts", "r") as f:
                server_content = f.read()
                
                improvements = [
                    ("Enhanced Socket Config", "pingTimeout" in server_content),
                    ("Ping Interval Setting", "pingInterval" in server_content),
                    ("Error Handling", "socket.on('error'" in server_content),
                    ("Connection Logging", "console.log" in server_content)
                ]
                
                for improvement, found in improvements:
                    self.log_result(f"Server - {improvement}", found)
                    
        except Exception as e:
            self.log_result("Server - Code Analysis", False, str(e))
    
    def test_database_functionality(self):
        """Test database operations through API"""
        print("\n🗄️ Testing Database Functionality...")
        
        try:
            # Get conversations
            response = requests.get(f"{self.server_url}/api/conversations")
            if response.status_code == 200:
                conversations = response.json()
                
                self.log_result("Database - Conversation Retrieval", True, f"{len(conversations)} conversations")
                
                # If we have conversations, test message retrieval
                if conversations:
                    conv_id = conversations[0]['id']
                    msg_response = requests.get(f"{self.server_url}/api/conversations/{conv_id}/messages")
                    if msg_response.status_code == 200:
                        messages = msg_response.json()
                        self.log_result("Database - Message Retrieval", True, f"{len(messages)} messages")
                    else:
                        self.log_result("Database - Message Retrieval", False, f"HTTP {msg_response.status_code}")
                else:
                    self.log_result("Database - Message Retrieval", True, "No conversations to test (expected)")
            else:
                self.log_result("Database - Connection", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_result("Database - Connection", False, str(e))
    
    def generate_report(self):
        """Generate test execution report"""
        print("\n" + "="*50)
        print("📊 QUICK TEST EXECUTION REPORT")
        print("="*50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['passed'])
        failed_tests = total_tests - passed_tests
        
        print(f"\n📈 Summary:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {passed_tests}")
        print(f"   Failed: {failed_tests}")
        print(f"   Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['passed']:
                    print(f"   - {result['test']}: {result['details']}")
        
        print(f"\n🔗 Socket Connection Fixes Status:")
        socket_tests = [r for r in self.test_results if any(keyword in r['test'] for keyword in ['Widget', 'Admin', 'Server'])]
        socket_passed = sum(1 for r in socket_tests if r['passed'])
        socket_total = len(socket_tests)
        
        if socket_total > 0:
            socket_rate = (socket_passed / socket_total) * 100
            print(f"   Connection Improvements: {socket_passed}/{socket_total} ({socket_rate:.1f}%)")
            
            if socket_rate >= 80:
                print("   ✅ Socket connection fixes successfully implemented")
            else:
                print("   ⚠️ Some socket connection improvements may need attention")
        
        # Save detailed report
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": (passed_tests/total_tests)*100
            },
            "results": self.test_results
        }
        
        try:
            with open("test-results/quick_test_report.json", "w") as f:
                json.dump(report_data, f, indent=2)
            print(f"\n📄 Detailed report saved: test-results/quick_test_report.json")
        except Exception as e:
            print(f"\n⚠️ Could not save report: {e}")
        
        return passed_tests == total_tests

def main():
    print("🚀 Chat System Quick Test Suite")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tester = QuickTester()
    
    # Run all tests
    tester.test_server_api()
    tester.test_admin_interface()
    tester.test_test_page()
    tester.test_socket_connection_improvements()
    tester.test_database_functionality()
    
    # Generate report
    all_passed = tester.generate_report()
    
    if all_passed:
        print("\n🎉 All tests passed! System is ready for full Selenium testing.")
        print("\nTo run full test suite:")
        print("1. Install Selenium: pip3 install selenium webdriver-manager pytest")
        print("2. Run: python3 tests/run_tests.py")
    else:
        print("\n⚠️ Some tests failed. Please check the issues above.")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())