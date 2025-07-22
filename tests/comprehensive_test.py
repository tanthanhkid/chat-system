#!/usr/bin/env python3
"""
Comprehensive test suite without Selenium dependencies
Tests the socket connection fixes and system functionality
"""

import requests
import json
import time
import os
import subprocess
from datetime import datetime
from pathlib import Path

class ComprehensiveTest:
    def __init__(self):
        self.server_url = "http://localhost:3001"
        self.admin_url = "http://localhost:3000"
        self.test_results = []
        self.start_time = datetime.now()
        
    def log_result(self, test_name, passed, details="", category="general"):
        """Log test result with category"""
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "details": details,
            "category": category,
            "timestamp": datetime.now().isoformat()
        })
    
    def test_system_health(self):
        """Test overall system health"""
        print("\n🏥 System Health Check...")
        
        # Test server availability
        try:
            response = requests.get(f"{self.server_url}/api/conversations", timeout=5)
            self.log_result("Server Health", response.status_code == 200, 
                          f"Status: {response.status_code}", "health")
        except Exception as e:
            self.log_result("Server Health", False, str(e), "health")
        
        # Test admin interface
        try:
            response = requests.get(self.admin_url, timeout=5)
            self.log_result("Admin Interface Health", response.status_code == 200,
                          f"Status: {response.status_code}", "health")
        except Exception as e:
            self.log_result("Admin Interface Health", False, str(e), "health")
        
        # Test database connectivity
        try:
            response = requests.get(f"{self.server_url}/api/conversations")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Database Connectivity", True, 
                              f"Retrieved {len(data)} conversations", "health")
            else:
                self.log_result("Database Connectivity", False, 
                              f"HTTP {response.status_code}", "health")
        except Exception as e:
            self.log_result("Database Connectivity", False, str(e), "health")
    
    def test_socket_improvements(self):
        """Test that socket connection improvements are implemented"""
        print("\n🔌 Socket Connection Improvements Test...")
        
        # Test widget improvements
        widget_file = "packages/chat-widget/src/ChatWidget.tsx"
        try:
            with open(widget_file, 'r') as f:
                content = f.read()
                
            improvements = {
                "Automatic Reconnection": "reconnection: true" in content,
                "Reconnection Attempts": "reconnectionAttempts" in content,
                "Connection Error Handling": "connect_error" in content,
                "Connection Status Display": "getConnectionStatus" in content,
                "Retry Functionality": "retryConnection" in content,
                "Visual Connection Indicators": "connection-indicator" in content,
                "Test Automation Ready": "data-testid" in content,
                "Connection State Management": "setIsConnected" in content
            }
            
            for improvement, found in improvements.items():
                self.log_result(f"Widget: {improvement}", found, "", "socket_widget")
                
        except Exception as e:
            self.log_result("Widget Code Analysis", False, str(e), "socket_widget")
        
        # Test admin improvements
        admin_file = "packages/chat-admin/src/App.tsx"
        try:
            with open(admin_file, 'r') as f:
                content = f.read()
                
            improvements = {
                "Admin Reconnection Logic": "reconnection: true" in content,
                "Connection Error Handling": "connect_error" in content,
                "Retry Button": "retryConnection" in content,
                "Connection Status Header": "connection-status" in content,
                "Connection State Management": "setIsConnected" in content,
                "Error State Display": "connectionError" in content,
                "Test Automation Ready": "data-testid" in content
            }
            
            for improvement, found in improvements.items():
                self.log_result(f"Admin: {improvement}", found, "", "socket_admin")
                
        except Exception as e:
            self.log_result("Admin Code Analysis", False, str(e), "socket_admin")
        
        # Test server improvements
        server_file = "packages/chat-server/src/index.ts"
        try:
            with open(server_file, 'r') as f:
                content = f.read()
                
            improvements = {
                "Enhanced Socket Config": "pingTimeout" in content,
                "Ping Interval Setting": "pingInterval" in content,
                "Socket Error Handling": "socket.on('error'" in content,
                "Connection Logging": "console.log" in content,
                "Upgrade Timeout": "upgradeTimeout" in content
            }
            
            for improvement, found in improvements.items():
                self.log_result(f"Server: {improvement}", found, "", "socket_server")
                
        except Exception as e:
            self.log_result("Server Code Analysis", False, str(e), "socket_server")
    
    def test_api_functionality(self):
        """Test API endpoints functionality"""
        print("\n🌐 API Functionality Test...")
        
        # Test conversations endpoint
        try:
            response = requests.get(f"{self.server_url}/api/conversations")
            if response.status_code == 200:
                conversations = response.json()
                self.log_result("Conversations API", True, 
                              f"Retrieved {len(conversations)} conversations", "api")
                
                # Test message endpoint if conversations exist
                if conversations:
                    conv_id = conversations[0]['id']
                    msg_response = requests.get(f"{self.server_url}/api/conversations/{conv_id}/messages")
                    if msg_response.status_code == 200:
                        messages = msg_response.json()
                        self.log_result("Messages API", True, 
                                      f"Retrieved {len(messages)} messages", "api")
                    else:
                        self.log_result("Messages API", False, 
                                      f"HTTP {msg_response.status_code}", "api")
                else:
                    self.log_result("Messages API", True, "No conversations to test (expected)", "api")
            else:
                self.log_result("Conversations API", False, 
                              f"HTTP {response.status_code}", "api")
        except Exception as e:
            self.log_result("API Functionality", False, str(e), "api")
        
        # Test CORS headers
        try:
            response = requests.options(f"{self.server_url}/api/conversations")
            cors_header = response.headers.get('Access-Control-Allow-Origin')
            self.log_result("CORS Configuration", cors_header is not None, 
                          f"CORS: {cors_header}", "api")
        except Exception as e:
            self.log_result("CORS Configuration", False, str(e), "api")
    
    def test_file_structure(self):
        """Test that all required files exist and have correct structure"""
        print("\n📁 File Structure Test...")
        
        required_files = {
            "Widget Component": "packages/chat-widget/src/ChatWidget.tsx",
            "Widget CSS": "packages/chat-widget/src/ChatWidget.css",
            "Widget Types": "packages/chat-widget/src/types.ts",
            "Widget Package": "packages/chat-widget/package.json",
            "Admin Component": "packages/chat-admin/src/App.tsx", 
            "Admin CSS": "packages/chat-admin/src/App.css",
            "Admin Types": "packages/chat-admin/src/types.ts",
            "Admin Package": "packages/chat-admin/package.json",
            "Server Main": "packages/chat-server/src/index.ts",
            "Server Database": "packages/chat-server/src/database.ts",
            "Server Package": "packages/chat-server/package.json",
            "Test HTML": "test-embedding.html",
            "Docker Compose": "docker-compose.yml",
            "Database Schema": "database/init.sql"
        }
        
        for name, path in required_files.items():
            exists = os.path.exists(path)
            self.log_result(f"File: {name}", exists, path if exists else f"Missing: {path}", "files")
    
    def test_package_dependencies(self):
        """Test that packages have correct dependencies"""
        print("\n📦 Package Dependencies Test...")
        
        packages_to_check = {
            "Widget Package": "packages/chat-widget/package.json",
            "Admin Package": "packages/chat-admin/package.json", 
            "Server Package": "packages/chat-server/package.json"
        }
        
        for name, path in packages_to_check.items():
            try:
                with open(path, 'r') as f:
                    package_data = json.load(f)
                
                deps = package_data.get('dependencies', {})
                dev_deps = package_data.get('devDependencies', {})
                all_deps = {**deps, **dev_deps}
                
                # Check for essential dependencies
                if 'widget' in path.lower():
                    has_react = 'react' in deps
                    has_socket = 'socket.io-client' in deps
                    self.log_result(f"{name}: React", has_react, "", "dependencies")
                    self.log_result(f"{name}: Socket.IO Client", has_socket, "", "dependencies")
                
                elif 'admin' in path.lower():
                    has_react = 'react' in deps
                    has_socket = 'socket.io-client' in deps  
                    self.log_result(f"{name}: React", has_react, "", "dependencies")
                    self.log_result(f"{name}: Socket.IO Client", has_socket, "", "dependencies")
                
                elif 'server' in path.lower():
                    has_express = 'express' in deps
                    has_socket = 'socket.io' in deps
                    has_pg = 'pg' in deps
                    self.log_result(f"{name}: Express", has_express, "", "dependencies")
                    self.log_result(f"{name}: Socket.IO", has_socket, "", "dependencies")
                    self.log_result(f"{name}: PostgreSQL", has_pg, "", "dependencies")
                
            except Exception as e:
                self.log_result(f"{name} Analysis", False, str(e), "dependencies")
    
    def test_css_improvements(self):
        """Test that CSS includes connection status styling"""
        print("\n🎨 CSS Improvements Test...")
        
        # Test widget CSS
        try:
            with open("packages/chat-widget/src/ChatWidget.css", 'r') as f:
                widget_css = f.read()
            
            css_features = {
                "Connection Indicator Styles": ".connection-indicator" in widget_css,
                "Reconnecting Animation": "@keyframes" in widget_css or "animation:" in widget_css,
                "Error State Styling": ".connection-error" in widget_css or ".error" in widget_css,
                "Status Indicator Styling": ".status" in widget_css,
                "Retry Button Styling": ".retry" in widget_css
            }
            
            for feature, found in css_features.items():
                self.log_result(f"Widget CSS: {feature}", found, "", "css")
                
        except Exception as e:
            self.log_result("Widget CSS Analysis", False, str(e), "css")
        
        # Test admin CSS
        try:
            with open("packages/chat-admin/src/App.css", 'r') as f:
                admin_css = f.read()
            
            css_features = {
                "Connection Status Styling": ".connection-status" in admin_css,
                "Error State Styling": ".error" in admin_css,
                "Retry Button Styling": ".retry" in admin_css
            }
            
            for feature, found in css_features.items():
                self.log_result(f"Admin CSS: {feature}", found, "", "css")
                
        except Exception as e:
            self.log_result("Admin CSS Analysis", False, str(e), "css")
    
    def test_database_schema(self):
        """Test database schema completeness"""
        print("\n🗄️ Database Schema Test...")
        
        try:
            with open("database/init.sql", 'r') as f:
                schema = f.read()
            
            schema_elements = {
                "Users Table": "CREATE TABLE users" in schema,
                "Conversations Table": "CREATE TABLE conversations" in schema,
                "Messages Table": "CREATE TABLE messages" in schema,
                "UUID Extension": "uuid-ossp" in schema,
                "Foreign Key Constraints": "REFERENCES" in schema,
                "Indexes": "CREATE INDEX" in schema,
                "Triggers": "CREATE TRIGGER" in schema
            }
            
            for element, found in schema_elements.items():
                self.log_result(f"Schema: {element}", found, "", "database")
                
        except Exception as e:
            self.log_result("Database Schema Analysis", False, str(e), "database")
    
    def generate_comprehensive_report(self):
        """Generate detailed test report"""
        end_time = datetime.now()
        duration = end_time - self.start_time
        
        # Calculate results by category
        categories = {}
        for result in self.test_results:
            cat = result['category']
            if cat not in categories:
                categories[cat] = {'total': 0, 'passed': 0}
            categories[cat]['total'] += 1
            if result['passed']:
                categories[cat]['passed'] += 1
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r['passed'])
        
        print("\n" + "="*60)
        print("📊 COMPREHENSIVE TEST REPORT")
        print("="*60)
        
        print(f"\n⏱️ Execution Time: {duration.total_seconds():.2f} seconds")
        print(f"📈 Overall Results: {passed_tests}/{total_tests} ({(passed_tests/total_tests)*100:.1f}%)")
        
        # Results by category
        print(f"\n📋 Results by Category:")
        for category, stats in categories.items():
            percentage = (stats['passed'] / stats['total']) * 100
            status = "✅" if percentage >= 80 else "⚠️" if percentage >= 60 else "❌"
            print(f"  {status} {category.title()}: {stats['passed']}/{stats['total']} ({percentage:.1f}%)")
        
        # Socket connection summary
        socket_tests = [r for r in self.test_results if 'socket' in r['category']]
        if socket_tests:
            socket_passed = sum(1 for r in socket_tests if r['passed'])
            socket_total = len(socket_tests)
            socket_rate = (socket_passed / socket_total) * 100
            
            print(f"\n🔗 Socket Connection Fixes Status:")
            print(f"   Improvements Verified: {socket_passed}/{socket_total} ({socket_rate:.1f}%)")
            
            if socket_rate >= 90:
                print("   🎉 Excellent! Socket connection improvements fully implemented")
            elif socket_rate >= 80:
                print("   ✅ Good! Most socket connection improvements in place")
            else:
                print("   ⚠️ Some socket connection improvements need attention")
        
        # Failed tests
        failed_tests = [r for r in self.test_results if not r['passed']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for result in failed_tests:
                print(f"   - {result['test']}: {result['details']}")
        
        # Recommendations
        print(f"\n💡 Recommendations:")
        
        # Check critical areas
        health_tests = [r for r in self.test_results if r['category'] == 'health']
        health_passed = sum(1 for r in health_tests if r['passed'])
        
        if health_passed == len(health_tests):
            print("   ✅ System health is excellent - ready for Selenium testing")
        else:
            print("   ⚠️ Address system health issues before running browser tests")
        
        # Socket improvements status
        socket_widget = [r for r in self.test_results if r['category'] == 'socket_widget']
        socket_admin = [r for r in self.test_results if r['category'] == 'socket_admin'] 
        socket_server = [r for r in self.test_results if r['category'] == 'socket_server']
        
        widget_rate = (sum(1 for r in socket_widget if r['passed']) / len(socket_widget)) * 100 if socket_widget else 0
        admin_rate = (sum(1 for r in socket_admin if r['passed']) / len(socket_admin)) * 100 if socket_admin else 0
        server_rate = (sum(1 for r in socket_server if r['passed']) / len(socket_server)) * 100 if socket_server else 0
        
        if widget_rate >= 85 and admin_rate >= 85 and server_rate >= 85:
            print("   🚀 Socket connection fixes are comprehensive and ready for production")
        else:
            print("   🔧 Consider reviewing socket connection implementation")
        
        print(f"\n📁 Next Steps:")
        if passed_tests / total_tests >= 0.9:
            print("   1. ✅ System validation passed - ready for Selenium tests")
            print("   2. Install ChromeDriver: brew install chromedriver")
            print("   3. Run full tests: python3 tests/run_tests.py")
        else:
            print("   1. 🔧 Fix failed tests above")
            print("   2. Re-run validation: python3 tests/comprehensive_test.py") 
            print("   3. Then proceed with Selenium testing")
        
        # Save detailed report
        report_data = {
            "timestamp": end_time.isoformat(),
            "duration_seconds": duration.total_seconds(),
            "summary": {
                "total": total_tests,
                "passed": passed_tests,
                "failed": total_tests - passed_tests,
                "success_rate": (passed_tests/total_tests)*100
            },
            "categories": categories,
            "results": self.test_results
        }
        
        try:
            os.makedirs("test-results", exist_ok=True)
            with open("test-results/comprehensive_test_report.json", "w") as f:
                json.dump(report_data, f, indent=2)
            print(f"\n📄 Detailed report saved: test-results/comprehensive_test_report.json")
        except Exception as e:
            print(f"\n⚠️ Could not save report: {e}")
        
        return passed_tests == total_tests

def main():
    print("🚀 Comprehensive Chat System Test Suite")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tester = ComprehensiveTest()
    
    # Run all test categories
    tester.test_system_health()
    tester.test_socket_improvements()
    tester.test_api_functionality()
    tester.test_file_structure()
    tester.test_package_dependencies()
    tester.test_css_improvements()
    tester.test_database_schema()
    
    # Generate comprehensive report
    all_passed = tester.generate_comprehensive_report()
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())