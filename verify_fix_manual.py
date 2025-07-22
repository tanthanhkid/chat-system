#!/usr/bin/env python3
"""
Verify the fix manually - should show detailed console logs
"""
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

user_driver = webdriver.Chrome(options=options)
admin_driver = webdriver.Chrome(options=options)

try:
    print("🔧 VERIFYING STALE CLOSURE FIX")
    print("================================")
    
    # Step 1: Open admin and connect
    print("\n1️⃣ Opening admin interface...")
    admin_driver.get("http://localhost:3000")
    time.sleep(3)
    
    connection_status = admin_driver.find_element(By.CSS_SELECTOR, ".connection-status")
    print(f"   Status: {connection_status.text}")
    
    # Step 2: User 1 sends message
    print("\n2️⃣ User 1 sends 'cow' message...")
    user_driver.get("http://localhost:5500/test-embedding.html")
    time.sleep(1)
    
    user1_btn = user_driver.find_element(By.XPATH, "//button[text()='User 1']")
    user1_btn.click()
    time.sleep(1)
    
    chat_toggle = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
    chat_toggle.click()
    time.sleep(2)
    
    message_input = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='message-input']")
    send_button = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='send-button']")
    
    message_input.send_keys("cow")
    send_button.click()
    time.sleep(2)
    print("   ✅ User 1 sent 'cow'")
    
    # Step 3: Admin selects User 1 conversation
    print("\n3️⃣ Admin selects User 1 conversation...")
    user1_conv = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='conversation-user1@example.com']")
    user1_conv.click()
    time.sleep(2)
    print("   ✅ User 1 conversation selected")
    
    # Step 4: User 2 sends 'cat' - THE CRITICAL MOMENT
    print("\n4️⃣ User 2 sends 'cat' - CRITICAL TEST...")
    
    user2_btn = user_driver.find_element(By.XPATH, "//button[text()='User 2']")
    user2_btn.click()
    time.sleep(1)
    
    # Ensure chat is open
    try:
        message_input = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='message-input']")
    except:
        chat_toggle = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
        chat_toggle.click()
        time.sleep(2)
        message_input = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='message-input']")
    
    send_button = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='send-button']")
    message_input.clear()
    message_input.send_keys("cat")
    send_button.click()
    time.sleep(3)  # Wait for real-time update
    print("   ✅ User 2 sent 'cat'")
    
    # Step 5: Check browser console for our detailed logs
    print("\n5️⃣ Checking admin browser console logs...")
    print("   (Looking for our filtering logic messages)")
    
    logs = admin_driver.get_log('browser')
    relevant_logs = []
    
    for log in logs:
        message = log['message']
        if any(keyword in message for keyword in [
            '🔍 ADMIN: New user message received',
            '✅ ADMIN: Adding message to main chat',
            '❌ ADMIN: NOT adding message to main chat',
            '🔄 ADMIN: Selecting conversation',
            'currentSelectedConversation',
            'willAddToMainChat'
        ]):
            relevant_logs.append(log)
    
    if relevant_logs:
        print("   📋 FILTERING LOGIC LOGS:")
        for log in relevant_logs[-10:]:  # Last 10 relevant logs
            timestamp = time.strftime('%H:%M:%S', time.localtime(log['timestamp']/1000))
            print(f"   [{timestamp}] {log['message']}")
    else:
        print("   ⚠️  No filtering logic logs found in browser console")
        print("   This might indicate the console.log statements aren't working")
    
    # Step 6: Check current chat window content
    print("\n6️⃣ Checking User 1's chat window...")
    chat_messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='admin-message-']")
    
    last_3_messages = []
    for msg in chat_messages[-3:]:
        last_3_messages.append(msg.text.strip())
    
    print(f"   Last 3 messages in chat: {last_3_messages}")
    
    has_cat = any("cat" in msg.lower() for msg in last_3_messages)
    
    if has_cat:
        print("   ❌ BUG STILL EXISTS: 'cat' found in User 1's chat window!")
        print("   🔍 The stale closure fix may not be working")
    else:
        print("   ✅ BUG FIXED: 'cat' NOT found in User 1's chat window!")
        print("   🎉 Stale closure fix is working correctly")
    
    print("\n================================")
    print("🔧 MANUAL VERIFICATION COMPLETE")
    print("================================")
    
    # Wait a moment before closing
    time.sleep(2)
    
except Exception as e:
    print(f"❌ Test failed with error: {e}")
    
finally:
    user_driver.quit()
    admin_driver.quit()