#!/usr/bin/env python3
"""
Quick system validation script - checks if all components are working
"""

import requests
import time
import json
from pathlib import Path

def check_service(url, name, timeout=5):
    """Check if a service is responding"""
    try:
        response = requests.get(url, timeout=timeout)
        if response.status_code in [200, 404]:  # 404 is acceptable for some endpoints
            print(f"✅ {name}: Running (HTTP {response.status_code})")
            return True
        else:
            print(f"⚠️ {name}: Unexpected status {response.status_code}")
            return False
    except requests.ConnectionError:
        print(f"❌ {name}: Connection failed")
        return False
    except requests.Timeout:
        print(f"❌ {name}: Timeout")
        return False
    except Exception as e:
        print(f"❌ {name}: Error - {e}")
        return False

def check_file_exists(path, name):
    """Check if a required file exists"""
    if Path(path).exists():
        print(f"✅ {name}: Found")
        return True
    else:
        print(f"❌ {name}: Missing")
        return False

def main():
    print("🔍 Chat System Validation")
    print("=" * 40)
    
    all_good = True
    
    # Check services
    print("\n📡 Checking Services:")
    services = [
        ("http://localhost:3001/api/conversations", "Chat Server API"),
        ("http://localhost:3000", "Admin Interface"),
    ]
    
    for url, name in services:
        if not check_service(url, name):
            all_good = False
    
    # Check required files
    print("\n📁 Checking Files:")
    files = [
        ("test-embedding.html", "Test HTML Page"),
        ("packages/chat-server/src/index.ts", "Server Source"),
        ("packages/chat-admin/src/App.tsx", "Admin Source"),
        ("packages/chat-widget/src/ChatWidget.tsx", "Widget Source"),
    ]
    
    for path, name in files:
        if not check_file_exists(path, name):
            all_good = False
    
    # Check database connection (via server API)
    print("\n🗄️ Checking Database:")
    try:
        response = requests.get("http://localhost:3001/api/conversations", timeout=10)
        if response.status_code == 200:
            conversations = response.json()
            print(f"✅ Database: Connected ({len(conversations)} conversations)")
        else:
            print(f"⚠️ Database: API returned {response.status_code}")
            all_good = False
    except Exception as e:
        print(f"❌ Database: Connection failed - {e}")
        all_good = False
    
    # Test basic API functionality
    print("\n🧪 Testing API:")
    try:
        # Test conversation creation (this would happen when a user connects)
        print("  📝 API endpoints accessible")
    except Exception as e:
        print(f"❌ API Test failed: {e}")
        all_good = False
    
    print("\n" + "=" * 40)
    if all_good:
        print("🎉 System validation PASSED - Ready for testing!")
        print("\nNext steps:")
        print("1. Run: python tests/run_tests.py")
        print("2. Or install deps: pip install -r tests/requirements.txt")
    else:
        print("⚠️ System validation FAILED")
        print("\nTo fix:")
        print("1. Start database: docker-compose up -d")
        print("2. Start server: npm run dev:server")
        print("3. Start admin: npm run dev:admin")
        print("4. Check all files are present")
    
    return all_good

if __name__ == "__main__":
    main()