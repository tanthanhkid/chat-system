#!/usr/bin/env python3
"""
Debug the real UI behavior - check browser console for filtering logic
"""
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

def debug_real_ui_behavior():
    """Debug real UI behavior with console logging"""
    
    options = Options()
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    # Enable console logging
    options.add_experimental_option('useAutomationExtension', False)
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    
    user_driver = webdriver.Chrome(options=options)
    admin_driver = webdriver.Chrome(options=options)
    
    try:
        print("=== DEBUGGING REAL UI BEHAVIOR ===")
        
        # Step 1: Open admin first
        print("[STEP 1] Opening admin interface...")
        admin_driver.get("http://localhost:3000")
        time.sleep(3)
        
        # Wait for connection
        connection_status = admin_driver.find_element(By.CSS_SELECTOR, ".connection-status")
        print(f"Admin connection: {connection_status.text}")
        
        # Step 2: User 1 sends cow
        print("\n[STEP 2] User 1 sends 'cow'...")
        user_driver.get("http://localhost:5500/test-embedding.html")
        time.sleep(2)
        
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
        print("✅ User 1 sent 'cow'")
        
        # Step 3: Admin clicks User 1 conversation
        print("\n[STEP 3] Admin selects User 1 conversation...")
        user1_conv = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='conversation-user1@example.com']")
        user1_conv.click()
        time.sleep(2)
        print("✅ Admin selected User 1 conversation")
        
        # Check browser console logs at this point
        print("\n[ADMIN CONSOLE] After User 1 selection:")
        logs = admin_driver.get_log('browser')
        for log in logs[-10:]:
            if any(keyword in log['message'] for keyword in ['ADMIN:', 'selectedConversation', 'conversation']):
                print(f"  {log['message']}")
        
        # Step 4: User 2 sends cat (critical moment)
        print("\n[STEP 4] User 2 sends 'cat' (CRITICAL TEST)...")
        
        # Switch to User 2
        user2_btn = user_driver.find_element(By.XPATH, "//button[text()='User 2']")
        user2_btn.click()
        time.sleep(2)
        
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
        
        print("✅ User 2 sent 'cat'")
        
        # Step 5: Check admin console logs for filtering
        print("\n[ADMIN CONSOLE] After User 2 'cat' message:")
        logs = admin_driver.get_log('browser')
        for log in logs[-15:]:
            if any(keyword in log['message'] for keyword in ['ADMIN:', 'new-user-message', 'cat', 'cow', 'selectedConversation', 'willAddToMainChat']):
                print(f"  {log['message']}")
        
        # Step 6: Check what's actually in User 1's chat window
        print("\n[STEP 6] Checking User 1's chat window content...")
        chat_messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='admin-message-']")
        print(f"Found {len(chat_messages)} messages in chat window")
        
        chat_content = ""
        for msg in chat_messages[-5:]:  # Last 5 messages
            chat_content += msg.text + " | "
        
        print(f"Last 5 messages: {chat_content}")
        
        if "cat" in chat_content.lower():
            print("❌ BUG CONFIRMED: 'cat' message appears in User 1's chat window!")
            print("   The filtering logic is NOT working correctly in the UI")
        else:
            print("✅ Filter working: 'cat' message not in User 1's chat window")
        
        # Step 7: Let's manually inspect what selectedConversation is
        selected_conversation = admin_driver.execute_script("return window.React && window.React.version ? 'React found' : 'No React'")
        print(f"\nReact detection: {selected_conversation}")
        
        # Keep browsers open for manual inspection
        print("\n=== MANUAL INSPECTION NEEDED ===")
        print("Admin interface is open - manually check:")
        print("1. Is User 1's conversation selected (highlighted)?") 
        print("2. Do you see 'cat' message in the main chat area?")
        print("3. Check browser console for ADMIN: logs")
        
        input("Press Enter after manual inspection to continue...")
        
    finally:
        user_driver.quit()
        admin_driver.quit()

if __name__ == "__main__":
    debug_real_ui_behavior()