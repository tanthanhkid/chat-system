#!/usr/bin/env python3
"""
Manual test to reproduce the exact user scenario and capture browser console logs
"""
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

def manual_test_with_logging():
    """Manual reproduction of the exact user scenario with console logging"""
    
    options = Options()
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    # Enable console logging
    options.add_argument('--enable-logging')
    options.add_argument('--log-level=0')
    
    user_driver = webdriver.Chrome(options=options)
    admin_driver = webdriver.Chrome(options=options)
    
    try:
        print("=== MANUAL TEST: EXACT USER SCENARIO ===")
        
        # Step 1: Open admin interface first and wait for connection
        print("[STEP 1] Opening admin interface...")
        admin_driver.get("http://localhost:3000")
        time.sleep(5)
        
        # Check connection status
        connection_status = admin_driver.find_element(By.CSS_SELECTOR, ".connection-status")
        print(f"Admin connection status: {connection_status.text}")
        
        # Count initial conversations
        try:
            conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            print(f"Initial conversations in admin: {len(conversations)}")
        except:
            print("No conversations found initially")
        
        # Step 2: Open user interface as User 1
        print("\n[STEP 2] Opening user interface as User 1...")
        user_driver.get("http://localhost:5500/test-embedding.html")
        time.sleep(2)
        
        # Switch to User 1
        user1_btn = user_driver.find_element(By.XPATH, "//button[text()='User 1']")
        user1_btn.click()
        time.sleep(1)
        
        # Open chat widget
        chat_toggle = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
        chat_toggle.click()
        time.sleep(2)
        
        print("User 1 chat widget opened")
        
        # Step 3: Send "cow" message
        print("\n[STEP 3] User 1 sending 'cow' message...")
        message_input = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='message-input']")
        send_button = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='send-button']")
        
        message_input.send_keys("cow")
        time.sleep(1)
        send_button.click()
        
        print("✅ User 1 sent 'cow' message")
        
        # Step 4: Wait and check admin interface for real-time updates
        print("\n[STEP 4] Checking admin interface for real-time updates...")
        time.sleep(3)  # Wait for real-time update
        
        # Count conversations again
        try:
            conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            print(f"Conversations after User 1 message: {len(conversations)}")
            
            # Look for User 1 specifically
            user1_found = False
            for conv in conversations:
                if "user1@example.com" in conv.text:
                    user1_found = True
                    print(f"✅ Found User 1 conversation: {conv.text[:100]}...")
                    break
            
            if not user1_found:
                print("❌ User 1 conversation not found in sidebar")
                
        except Exception as e:
            print(f"Error checking conversations: {e}")
            
        # Step 5: Get browser console logs from admin
        print("\n[STEP 5] Admin browser console logs:")
        logs = admin_driver.get_log('browser')
        for log in logs[-20:]:  # Last 20 logs
            if 'ADMIN:' in log['message']:
                print(f"  {log['message']}")
        
        # Step 6: Switch to User 2 and send "cat" message
        print("\n[STEP 6] Switching to User 2 and sending 'cat' message...")
        
        # Switch to User 2 in same tab
        user2_btn = user_driver.find_element(By.XPATH, "//button[text()='User 2']")
        user2_btn.click()
        time.sleep(1)
        
        # Send "cat" message  
        message_input = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='message-input']")
        send_button = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='send-button']")
        
        message_input.clear()
        message_input.send_keys("cat")
        time.sleep(1)
        send_button.click()
        
        print("✅ User 2 sent 'cat' message")
        
        # Step 7: Check admin for contamination bug
        print("\n[STEP 7] Checking admin for message contamination...")
        time.sleep(3)  # Wait for real-time update
        
        # Get latest browser console logs
        print("Latest admin console logs:")
        logs = admin_driver.get_log('browser')
        for log in logs[-10:]:  # Last 10 logs
            if any(keyword in log['message'] for keyword in ['ADMIN:', 'cat', 'cow', 'new-user-message']):
                print(f"  {log['message']}")
        
        print("\n=== TEST COMPLETED ===")
        print("Check the console logs above to see if:")
        print("1. User 1's 'cow' message updates the admin sidebar")
        print("2. User 2's 'cat' message appears in the wrong conversation")
        
        # Keep browsers open for manual inspection
        input("Press Enter to close browsers...")
        
    finally:
        user_driver.quit()
        admin_driver.quit()

if __name__ == "__main__":
    manual_test_with_logging()