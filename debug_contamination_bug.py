#!/usr/bin/env python3
"""
Comprehensive Selenium test to debug the exact contamination bug described:
1. Admin opens User1 chat window
2. Open embedding chat with User2 
3. User2 sends message
4. Check if User2's message appears in User1's admin chat window (BUG)
"""
import time
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

class ContaminationBugDebugger:
    def __init__(self):
        self.setup_logging()
        self.chrome_options = Options()
        self.chrome_options.add_argument('--no-sandbox')
        self.chrome_options.add_argument('--disable-dev-shm-usage')
        # Enable console logging
        self.chrome_options.add_argument('--enable-logging')
        self.chrome_options.add_argument('--log-level=0')
        
    def setup_logging(self):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
    def log_step(self, step, status="INFO"):
        timestamp = time.strftime('%H:%M:%S')
        if status == "ERROR":
            print(f"❌ [{timestamp}] {step}")
        elif status == "SUCCESS":
            print(f"✅ [{timestamp}] {step}")
        elif status == "WARNING":
            print(f"⚠️ [{timestamp}] {step}")
        else:
            print(f"🔍 [{timestamp}] {step}")
        self.logger.info(step)
        
    def create_driver(self):
        return webdriver.Chrome(options=self.chrome_options)
        
    def wait_for_element(self, driver, selector, timeout=10, by=By.CSS_SELECTOR):
        """Wait for element to be present and return it"""
        try:
            element = WebDriverWait(driver, timeout).until(
                EC.presence_of_element_located((by, selector))
            )
            return element
        except Exception as e:
            self.log_step(f"Element not found: {selector} - {e}", "ERROR")
            return None
            
    def get_chat_messages(self, admin_driver):
        """Get all messages from admin chat window"""
        try:
            messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='admin-message-']")
            message_texts = []
            for msg in messages:
                text = msg.text.strip()
                if text:
                    message_texts.append(text)
            return message_texts
        except Exception as e:
            self.log_step(f"Error getting chat messages: {e}", "ERROR")
            return []
            
    def get_browser_console_logs(self, driver, filter_keywords=None):
        """Get filtered browser console logs"""
        try:
            logs = driver.get_log('browser')
            if not filter_keywords:
                return logs
                
            filtered_logs = []
            for log in logs:
                message = log['message']
                if any(keyword in message for keyword in filter_keywords):
                    filtered_logs.append(log)
            return filtered_logs
        except Exception as e:
            self.log_step(f"Error getting console logs: {e}", "ERROR")
            return []

    def debug_contamination_bug(self):
        """Main test to debug the contamination bug"""
        
        self.log_step("=== DEBUGGING USER2 → USER1 CONTAMINATION BUG ===")
        
        admin_driver = self.create_driver()
        user_driver = self.create_driver()
        
        try:
            # STEP 1: Open admin interface and connect
            self.log_step("STEP 1: Opening admin interface")
            admin_driver.get("http://localhost:3000")
            time.sleep(3)
            
            # Wait for connection
            connection_status = self.wait_for_element(admin_driver, ".connection-status")
            if connection_status and "Connected" in connection_status.text:
                self.log_step("Admin connected successfully", "SUCCESS")
            else:
                self.log_step("Admin connection failed", "ERROR")
                return False
                
            # STEP 2: Admin opens User1 chat window
            self.log_step("STEP 2: Admin opens User1 chat window")
            
            # Find and click User1 conversation
            user1_conv = self.wait_for_element(admin_driver, "[data-testid='conversation-user1@example.com']")
            if not user1_conv:
                self.log_step("User1 conversation not found in sidebar", "ERROR")
                return False
                
            user1_conv.click()
            time.sleep(2)
            self.log_step("User1 conversation opened in admin", "SUCCESS")
            
            # Get initial messages in User1 chat
            initial_messages = self.get_chat_messages(admin_driver)
            initial_message_count = len(initial_messages)
            self.log_step(f"Initial message count in User1 chat: {initial_message_count}")
            
            if initial_messages:
                self.log_step(f"Last message before test: '{initial_messages[-1][:50]}...'")
            
            # STEP 3: Open embedding chat with User2 (critical step)
            self.log_step("STEP 3: Opening embedding chat as User2")
            user_driver.get("http://localhost:5500/test-embedding.html")
            time.sleep(2)
            
            # Click User2 button
            user2_btn = self.wait_for_element(user_driver, "//button[text()='User 2']", by=By.XPATH)
            if not user2_btn:
                self.log_step("User2 button not found", "ERROR")
                return False
                
            user2_btn.click()
            time.sleep(1)
            self.log_step("Switched to User2")
            
            # Open chat widget for User2
            chat_toggle = self.wait_for_element(user_driver, "[data-testid='chat-toggle-button']")
            if not chat_toggle:
                self.log_step("Chat toggle button not found", "ERROR")
                return False
                
            chat_toggle.click()
            time.sleep(2)
            self.log_step("User2 chat widget opened", "SUCCESS")
            
            # STEP 4: User2 sends message (the critical moment)
            self.log_step("STEP 4: User2 sending message - CRITICAL MOMENT")
            
            message_input = self.wait_for_element(user_driver, "[data-testid='message-input']")
            send_button = self.wait_for_element(user_driver, "[data-testid='send-button']")
            
            if not message_input or not send_button:
                self.log_step("Message input or send button not found", "ERROR")
                return False
            
            # Send a unique test message
            test_message = f"USER2_BUG_TEST_{int(time.time())}"
            message_input.clear()
            message_input.send_keys(test_message)
            time.sleep(1)
            send_button.click()
            
            self.log_step(f"User2 sent message: '{test_message}'", "SUCCESS")
            
            # STEP 5: Wait and check admin console logs
            self.log_step("STEP 5: Checking admin console logs for filtering behavior")
            time.sleep(3)  # Wait for real-time processing
            
            # Get console logs related to message filtering
            console_logs = self.get_browser_console_logs(admin_driver, [
                'ADMIN: New user message received',
                'ADMIN: Adding message to main chat',
                'ADMIN: NOT adding message to main chat',
                'currentSelectedConversation',
                'willAddToMainChat'
            ])
            
            self.log_step(f"Found {len(console_logs)} relevant console logs")
            for log in console_logs[-5:]:  # Last 5 relevant logs
                timestamp = time.strftime('%H:%M:%S', time.localtime(log['timestamp']/1000))
                self.log_step(f"[{timestamp}] {log['message']}")
            
            # STEP 6: Check if User2's message appears in User1's chat (THE BUG)
            self.log_step("STEP 6: Checking for contamination bug in User1's chat")
            
            current_messages = self.get_chat_messages(admin_driver)
            current_message_count = len(current_messages)
            
            self.log_step(f"Current message count in User1 chat: {current_message_count}")
            self.log_step(f"Message count change: +{current_message_count - initial_message_count}")
            
            # Check if the test message from User2 appears in User1's chat
            contamination_detected = False
            for message in current_messages:
                if test_message in message:
                    contamination_detected = True
                    self.log_step(f"🚨 CONTAMINATION BUG DETECTED!", "ERROR")
                    self.log_step(f"User2's message '{test_message}' found in User1's chat!", "ERROR")
                    self.log_step(f"Full message: '{message}'", "ERROR")
                    break
            
            if not contamination_detected:
                self.log_step("✅ NO CONTAMINATION: User2's message not found in User1's chat", "SUCCESS")
            
            # STEP 7: Additional debugging - check User2's conversation
            self.log_step("STEP 7: Verifying User2's message is in correct conversation")
            
            # Click User2 conversation in admin sidebar
            try:
                user2_conv = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='conversation-user2@example.com']")
                user2_conv.click()
                time.sleep(2)
                
                user2_messages = self.get_chat_messages(admin_driver)
                user2_has_message = any(test_message in msg for msg in user2_messages)
                
                if user2_has_message:
                    self.log_step("✅ User2's message correctly found in User2's conversation", "SUCCESS")
                else:
                    self.log_step("⚠️ User2's message NOT found in User2's conversation", "WARNING")
                    
            except Exception as e:
                self.log_step(f"Could not check User2's conversation: {e}", "WARNING")
            
            # STEP 8: Final analysis
            self.log_step("STEP 8: Final analysis")
            
            if contamination_detected:
                self.log_step("🔴 RESULT: CONTAMINATION BUG CONFIRMED", "ERROR")
                self.log_step("   - User2's message appeared in User1's chat window", "ERROR")
                self.log_step("   - The filtering logic is NOT working correctly", "ERROR")
                return False
            else:
                self.log_step("🟢 RESULT: NO CONTAMINATION DETECTED", "SUCCESS")  
                self.log_step("   - User2's message did NOT appear in User1's chat window", "SUCCESS")
                self.log_step("   - Message isolation is working correctly", "SUCCESS")
                return True
                
        except Exception as e:
            self.log_step(f"Test failed with exception: {e}", "ERROR")
            return False
            
        finally:
            self.log_step("Closing browser windows")
            admin_driver.quit()
            user_driver.quit()

    def run_debug(self):
        """Run the debugging test"""
        print("\n" + "="*80)
        print("🔍 CONTAMINATION BUG DEBUGGING TEST")
        print("="*80)
        
        success = self.debug_contamination_bug()
        
        print("\n" + "="*80)
        if success:
            print("✅ TEST PASSED: Message isolation working correctly")
            print("   No contamination bug detected")
        else:
            print("❌ TEST FAILED: Contamination bug confirmed")
            print("   User2's message appeared in User1's chat window")
            print("   Additional debugging and fixes needed")
        print("="*80)
        
        return success

if __name__ == "__main__":
    debugger = ContaminationBugDebugger()
    debugger.run_debug()