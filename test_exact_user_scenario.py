#!/usr/bin/env python3
"""
Test chính xác scenario của user:
1. User 1 chat "cow" → Admin thấy
2. User 2 chat "cat" (same tab) → Lỗi: "cat" xuất hiện trong chat User 1
3. Fix: "cat" chỉ nên xuất hiện trong sidebar
"""

import time
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

class ExactScenarioTest:
    def __init__(self):
        self.setup_logging()
        self.chrome_options = Options()
        self.chrome_options.add_argument('--no-sandbox')
        self.chrome_options.add_argument('--disable-dev-shm-usage')
        
    def setup_logging(self):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
    def create_driver(self):
        return webdriver.Chrome(options=self.chrome_options)
        
    def log_step(self, step):
        print(f"[{time.strftime('%H:%M:%S')}] {step}")
        self.logger.info(step)
        
    def test_exact_user_scenario(self):
        """Test chính xác scenario user mô tả"""
        
        self.log_step("=== TESTING EXACT USER SCENARIO ===")
        
        # Setup drivers
        user_driver = self.create_driver()
        admin_driver = self.create_driver()
        
        try:
            # Step 0: Setup admin first to ensure it's connected
            self.log_step("STEP 0: Setup admin connection first")
            admin_driver.get("http://localhost:3000")  # Admin running on port 3000
            time.sleep(5)  # Wait for admin to connect via Socket.IO
            
            # Verify admin is connected
            connection_status = admin_driver.find_element(By.CSS_SELECTOR, ".connection-status")
            if "Connected" not in connection_status.text:
                self.log_step("❌ Admin not connected, aborting test")
                return False
            self.log_step("✅ Admin connected successfully")
            
            # Step 1: User 1 chat "cow"
            self.log_step("STEP 1: User 1 chat 'cow'")
            user_driver.get("http://localhost:5500/test-embedding.html")
            time.sleep(2)
            
            # Click User 1 button
            user1_btn = user_driver.find_element(By.XPATH, "//button[text()='User 1']")
            user1_btn.click()
            time.sleep(1)
            
            # Open chat widget
            chat_toggle = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
            chat_toggle.click()
            time.sleep(2)
            
            # Send "cow" message
            message_input = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='message-input']")
            send_button = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='send-button']")
            
            message_input.send_keys("cow")
            time.sleep(1)
            send_button.click()
            time.sleep(3)  # Extra time for real-time update to reach admin
            
            self.log_step("✅ User 1 sent 'cow'")
            
            # Step 2: Admin views User 1 conversation
            self.log_step("STEP 2: Admin selects User 1 conversation")
            
            # Find User 1 conversation in sidebar with more specific selector
            user1_conversation = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='conversation-user1@example.com']")
            user1_conversation.click()
            time.sleep(2)
            
            # Verify "cow" appears in admin chat
            admin_messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='admin-message-']")
            admin_content = ' '.join([msg.text for msg in admin_messages])
            assert "cow" in admin_content, "Admin should see 'cow' message from User 1"
            self.log_step("✅ Admin sees User 1's 'cow' message")
            
            # Step 3: User 2 chat "cat" (SAME TAB - no reload)
            self.log_step("STEP 3: Switch to User 2 and chat 'cat' (same tab, no reload)")
            
            # Switch to User 2 in same tab
            user2_btn = user_driver.find_element(By.XPATH, "//button[text()='User 2']")
            user2_btn.click()
            time.sleep(2)
            
            # Ensure chat widget is open for User 2
            try:
                message_input = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='message-input']")
            except:
                # Chat widget might have closed, reopen it
                chat_toggle = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
                chat_toggle.click()
                time.sleep(2)
                message_input = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='message-input']")
            
            # Send "cat" message
            send_button = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='send-button']")
            
            message_input.clear()
            message_input.send_keys("cat")
            time.sleep(1)
            send_button.click()
            time.sleep(3)  # Give time for real-time update
            
            self.log_step("✅ User 2 sent 'cat'")
            
            # Step 4: CRITICAL TEST - Admin should NOT see "cat" in User 1's chat
            self.log_step("STEP 4: CRITICAL TEST - Check admin's User 1 chat window")
            
            # Get current admin chat content
            admin_messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='admin-message-']")
            current_admin_content = ' '.join([msg.text for msg in admin_messages])
            
            self.log_step(f"Admin chat content: '{current_admin_content}'")
            
            # THE CRITICAL TEST
            cat_appears_in_user1_chat = "cat" in current_admin_content
            
            if cat_appears_in_user1_chat:
                self.log_step("❌ BUG DETECTED: 'cat' message appeared in User 1's chat window!")
                self.log_step("   This is the exact bug user reported")
                return False
            else:
                self.log_step("✅ BUG FIXED: 'cat' message did NOT appear in User 1's chat window")
            
            # Step 5: Verify sidebar shows User 2 notification
            self.log_step("STEP 5: Check if sidebar shows User 2 notification")
            
            sidebar_conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            user2_in_sidebar = False
            
            for conv in sidebar_conversations:
                if "user2@example.com" in conv.text.lower():
                    user2_in_sidebar = True
                    self.log_step("✅ User 2 conversation found in sidebar")
                    break
                    
            # Step 6: Admin clicks User 2 conversation to see "cat"
            self.log_step("STEP 6: Admin switches to User 2 to see 'cat' message")
            
            user2_conversation = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='conversation-user2@example.com']")
            user2_conversation.click()
            time.sleep(2)
            
            # Verify "cat" appears in User 2's chat
            admin_messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='admin-message-']")
            user2_chat_content = ' '.join([msg.text for msg in admin_messages])
            
            if "cat" in user2_chat_content:
                self.log_step("✅ 'cat' message correctly appears in User 2's conversation")
                return True
            else:
                self.log_step("❌ 'cat' message missing from User 2's conversation")
                return False
                
        except Exception as e:
            self.log_step(f"❌ Test failed with error: {e}")
            return False
            
        finally:
            user_driver.quit()
            admin_driver.quit()
            
    def run_test(self):
        """Run the test and report results"""
        success = self.test_exact_user_scenario()
        
        print("\n" + "="*60)
        if success:
            print("🎉 TEST PASSED: Real-time message isolation working correctly!")
            print("   - User 2's 'cat' did NOT contaminate User 1's chat")
            print("   - Message isolation maintained perfectly")
        else:
            print("❌ TEST FAILED: Bug still exists")
            print("   - User 2's 'cat' message appeared in wrong chat")
            print("   - Need to fix real-time message handling")
        print("="*60)
        
        return success

if __name__ == "__main__":
    tester = ExactScenarioTest()
    tester.run_test()