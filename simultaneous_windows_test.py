#!/usr/bin/env python3
"""
Test with both windows open simultaneously:
1. Admin interface with User1 chat window open
2. User2 chat widget open at the same time
3. Send message from User2 while admin is viewing User1 chat
4. Check if User2's message contaminates User1's chat window
"""
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

class SimultaneousWindowsTest:
    def __init__(self):
        self.chrome_options = Options()
        self.chrome_options.add_argument('--no-sandbox')
        self.chrome_options.add_argument('--disable-dev-shm-usage')
        
    def create_driver(self):
        return webdriver.Chrome(options=self.chrome_options)
        
    def log_step(self, step, status="INFO"):
        timestamp = time.strftime('%H:%M:%S')
        icons = {"ERROR": "❌", "SUCCESS": "✅", "WARNING": "⚠️", "INFO": "🔍"}
        print(f"{icons.get(status, '🔍')} [{timestamp}] {step}")
        
    def get_chat_messages_text(self, admin_driver):
        """Get all message text from admin chat window"""
        try:
            messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='admin-message-']")
            return [msg.text.strip() for msg in messages if msg.text.strip()]
        except:
            return []

    def test_simultaneous_contamination(self):
        """Test contamination with both windows open simultaneously"""
        
        print("\n" + "="*80)
        print("🪟 SIMULTANEOUS WINDOWS CONTAMINATION TEST")
        print("="*80)
        
        admin_driver = self.create_driver()
        user_driver = self.create_driver()
        
        try:
            # Step 1: Open admin interface
            self.log_step("STEP 1: Opening admin interface")
            admin_driver.get("http://localhost:3000")
            time.sleep(3)
            
            # Wait for connection
            connection_status = admin_driver.find_element(By.CSS_SELECTOR, ".connection-status")
            if "Connected" not in connection_status.text:
                self.log_step("Admin not connected", "ERROR")
                return False
            self.log_step("Admin connected successfully", "SUCCESS")
            
            # Step 2: Admin opens User1 chat window
            self.log_step("STEP 2: Admin opening User1 chat window")
            user1_conv = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='conversation-user1@example.com']")
            user1_conv.click()
            time.sleep(2)
            
            initial_messages = self.get_chat_messages_text(admin_driver)
            initial_count = len(initial_messages)
            self.log_step(f"User1 chat opened - {initial_count} initial messages", "SUCCESS")
            
            # Step 3: Open User2 chat widget (SIMULTANEOUSLY)
            self.log_step("STEP 3: Opening User2 chat widget simultaneously")
            user_driver.get("http://localhost:5500/test-embedding.html")
            time.sleep(2)
            
            # Switch to User2
            user2_btn = user_driver.find_element(By.XPATH, "//button[text()='User 2']")
            user2_btn.click()
            time.sleep(1)
            
            # Open User2 chat widget
            chat_toggle = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
            chat_toggle.click()
            time.sleep(2)
            
            self.log_step("User2 chat widget opened", "SUCCESS")
            
            # Step 4: CRITICAL MOMENT - Both windows are now open simultaneously
            print("\n" + "="*60)
            print("🎯 CRITICAL STATE: BOTH WINDOWS OPEN SIMULTANEOUSLY")
            print("="*60)
            print("📱 Admin window: User1 chat is open and visible")
            print("💬 User window: User2 chat widget is open and ready")
            print("⚡ This is the exact scenario where contamination occurs")
            print("="*60)
            
            # Get baseline state
            baseline_messages = self.get_chat_messages_text(admin_driver)
            baseline_count = len(baseline_messages)
            
            if baseline_messages:
                self.log_step(f"Baseline - Last message in User1 chat: '{baseline_messages[-1][:40]}...'")
            
            # Step 5: Send message from User2 while User1 chat is open
            unique_message = f"CONTAMINATION_TEST_{int(time.time())}"
            self.log_step(f"STEP 5: Sending User2 message: '{unique_message}'")
            
            message_input = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='message-input']")
            send_button = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='send-button']")
            
            message_input.clear()
            message_input.send_keys(unique_message)
            time.sleep(0.5)
            
            # Send the message
            send_button.click()
            self.log_step(f"User2 message sent: '{unique_message}'", "SUCCESS")
            
            # Step 6: IMMEDIATE monitoring for contamination
            self.log_step("STEP 6: Monitoring User1 chat for contamination")
            
            contamination_detected = False
            
            for second in range(1, 6):  # Monitor for 5 seconds
                time.sleep(1)
                
                current_messages = self.get_chat_messages_text(admin_driver)
                current_count = len(current_messages)
                
                # Check for message count change
                if current_count != baseline_count:
                    self.log_step(f"Second {second}: Message count changed! {baseline_count} → {current_count}", "WARNING")
                    
                    # Check if our unique message appears in User1's chat
                    for msg in current_messages:
                        if unique_message in msg:
                            contamination_detected = True
                            self.log_step(f"🚨 CONTAMINATION DETECTED at second {second}!", "ERROR")
                            self.log_step(f"User2's message found in User1's chat: '{msg[:80]}'", "ERROR")
                            break
                    
                    if contamination_detected:
                        break
                        
                    # Show what new message was added
                    new_messages = current_messages[baseline_count:]
                    for new_msg in new_messages:
                        self.log_step(f"New message in User1 chat: '{new_msg[:60]}...'", "WARNING")
                        
                else:
                    self.log_step(f"Second {second}: No change (count: {current_count})")
            
            # Step 7: Final verification
            self.log_step("STEP 7: Final contamination verification")
            
            final_messages = self.get_chat_messages_text(admin_driver)
            final_contamination_check = any(unique_message in msg for msg in final_messages)
            
            if final_contamination_check:
                self.log_step("🚨 FINAL RESULT: CONTAMINATION CONFIRMED", "ERROR")
                self.log_step(f"User2's message '{unique_message}' found in User1's chat window", "ERROR")
                contamination_detected = True
            else:
                self.log_step("✅ FINAL RESULT: NO CONTAMINATION", "SUCCESS")
                self.log_step(f"User2's message '{unique_message}' NOT found in User1's chat window", "SUCCESS")
            
            # Step 8: Verify message is in correct location (User2's conversation)
            self.log_step("STEP 8: Verifying message is in User2's conversation")
            
            # Switch admin to User2 conversation
            user2_conv = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='conversation-user2@example.com']")
            user2_conv.click()
            time.sleep(2)
            
            user2_messages = self.get_chat_messages_text(admin_driver)
            user2_has_message = any(unique_message in msg for msg in user2_messages)
            
            if user2_has_message:
                self.log_step("✅ Message correctly found in User2's conversation", "SUCCESS")
            else:
                self.log_step("❌ Message NOT found in User2's conversation", "ERROR")
            
            # Step 9: Show final results
            print("\n" + "="*80)
            print("📊 FINAL TEST RESULTS")
            print("="*80)
            
            if contamination_detected:
                print("❌ CONTAMINATION BUG CONFIRMED")
                print(f"   - User2's message '{unique_message}' appeared in User1's chat")
                print("   - This confirms the real-time contamination issue")
                print("   - The filtering logic is not working correctly")
                return False
            else:
                print("✅ NO CONTAMINATION DETECTED")
                print(f"   - User2's message '{unique_message}' stayed in User2's conversation")
                print("   - Message isolation is working correctly")
                print("   - The filtering logic is working as expected")
                return True
                
        except Exception as e:
            self.log_step(f"Test failed with exception: {e}", "ERROR")
            return False
            
        finally:
            # Keep browsers open for manual inspection
            print(f"\n🔍 MANUAL INSPECTION:")
            print(f"   - Admin window: Currently showing conversation")
            print(f"   - User window: User2 chat widget open")
            print(f"   - Test message: '{unique_message}'")
            
            try:
                input("\nPress Enter to close browsers and finish...")
            except:
                time.sleep(2)
                
            admin_driver.quit()
            user_driver.quit()

if __name__ == "__main__":
    test = SimultaneousWindowsTest()
    success = test.test_simultaneous_contamination()
    
    print("\n" + "="*80)
    if success:
        print("🎉 TEST RESULT: Message isolation working correctly!")
    else:
        print("🐛 TEST RESULT: Contamination bug detected - needs fixing!")
    print("="*80)