#!/usr/bin/env python3
"""
Two separate browser reproduction test:
Browser 1: Admin interface with User1 chat open
Browser 2: User2 chat widget 
Both browsers stay open simultaneously to reproduce the exact bug scenario
"""
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

class TwoBrowserReproduction:
    def __init__(self):
        self.chrome_options = Options()
        self.chrome_options.add_argument('--no-sandbox')
        self.chrome_options.add_argument('--disable-dev-shm-usage')
        # Position windows differently
        self.admin_options = Options()
        self.admin_options.add_argument('--no-sandbox')
        self.admin_options.add_argument('--disable-dev-shm-usage')
        self.admin_options.add_argument('--window-position=100,100')
        self.admin_options.add_argument('--window-size=800,600')
        
        self.user_options = Options()
        self.user_options.add_argument('--no-sandbox')
        self.user_options.add_argument('--disable-dev-shm-usage')
        self.user_options.add_argument('--window-position=950,100')
        self.user_options.add_argument('--window-size=600,600')
        
    def log_step(self, step, status="INFO"):
        timestamp = time.strftime('%H:%M:%S')
        icons = {"ERROR": "❌", "SUCCESS": "✅", "WARNING": "⚠️", "INFO": "🔍"}
        print(f"{icons.get(status, '🔍')} [{timestamp}] {step}")

    def setup_admin_browser(self):
        """Setup admin browser with User1 chat open"""
        self.log_step("Setting up Admin Browser (Browser 1)")
        
        admin_driver = webdriver.Chrome(options=self.admin_options)
        
        # Open admin interface
        admin_driver.get("http://localhost:3000")
        time.sleep(3)
        
        # Wait for connection
        connection_status = admin_driver.find_element(By.CSS_SELECTOR, ".connection-status")
        if "Connected" not in connection_status.text:
            self.log_step("Admin connection failed!", "ERROR")
            return None
            
        self.log_step("Admin connected successfully", "SUCCESS")
        
        # Click on User1 conversation
        user1_conv = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='conversation-user1@example.com']")
        user1_conv.click()
        time.sleep(2)
        
        # Get initial message count
        initial_messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='admin-message-']")
        initial_count = len(initial_messages)
        
        self.log_step(f"Admin: User1 chat opened ({initial_count} messages)", "SUCCESS")
        
        return admin_driver, initial_count

    def setup_user_browser(self):
        """Setup user browser with User2 chat widget"""
        self.log_step("Setting up User Browser (Browser 2)")
        
        user_driver = webdriver.Chrome(options=self.user_options)
        
        # Open user embedding page
        user_driver.get("http://localhost:5500/test-embedding.html")
        time.sleep(2)
        
        # Click User2 button
        user2_btn = user_driver.find_element(By.XPATH, "//button[text()='User 2']")
        user2_btn.click()
        time.sleep(1)
        
        # Open User2 chat widget
        chat_toggle = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
        chat_toggle.click()
        time.sleep(2)
        
        self.log_step("User2 chat widget opened", "SUCCESS")
        
        return user_driver

    def reproduce_contamination_bug(self):
        """Main reproduction test with 2 separate browsers"""
        
        print("\n" + "="*80)
        print("🌍 TWO BROWSER CONTAMINATION REPRODUCTION")
        print("="*80)
        print("This test opens 2 separate browser windows simultaneously:")
        print("Browser 1: Admin interface with User1 chat open")  
        print("Browser 2: User2 chat widget")
        print("="*80)
        
        try:
            # Setup Browser 1 (Admin)
            self.log_step("PHASE 1: Setting up Browser 1 (Admin)")
            admin_result = self.setup_admin_browser()
            if not admin_result:
                return False
                
            admin_driver, initial_count = admin_result
            
            # Setup Browser 2 (User2) 
            self.log_step("PHASE 2: Setting up Browser 2 (User2)")
            user_driver = self.setup_user_browser()
            
            # Critical moment - both browsers are now open
            print("\n" + "🚨" * 30)
            print("🔥 CRITICAL STATE: BOTH BROWSERS OPEN SIMULTANEOUSLY")
            print("🚨" * 30)
            print("Browser 1 (Admin): User1 chat window is open and visible")
            print("Browser 2 (User2): Chat widget is open and ready to send")
            print("This is the EXACT scenario where contamination occurs!")
            print("🚨" * 30)
            
            # Wait a moment to ensure both are fully loaded
            time.sleep(2)
            
            # Send message from User2 (Browser 2)
            unique_message = f"TWO_BROWSER_TEST_{int(time.time())}"
            self.log_step(f"PHASE 3: Sending User2 message: '{unique_message}'")
            
            message_input = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='message-input']")
            send_button = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='send-button']")
            
            message_input.clear()
            message_input.send_keys(unique_message)
            time.sleep(0.5)
            send_button.click()
            
            self.log_step(f"User2 message sent from Browser 2!", "SUCCESS")
            
            # Monitor Browser 1 (Admin) for contamination
            self.log_step("PHASE 4: Monitoring Browser 1 (Admin) for contamination")
            
            contamination_detected = False
            
            # Real-time monitoring
            for second in range(1, 8):  # Monitor for 7 seconds
                time.sleep(1)
                
                # Get current messages in admin (Browser 1)
                current_messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='admin-message-']")
                current_count = len(current_messages)
                
                if current_count != initial_count:
                    self.log_step(f"Second {second}: Message count changed! {initial_count} → {current_count}", "WARNING")
                    
                    # Check if User2's message appears in User1's chat
                    for msg in current_messages[initial_count:]:
                        msg_text = msg.text.strip()
                        if unique_message in msg_text:
                            contamination_detected = True
                            self.log_step("🚨🚨🚨 CONTAMINATION BUG REPRODUCED! 🚨🚨🚨", "ERROR")
                            self.log_step(f"User2's message appeared in User1's chat window!", "ERROR")
                            self.log_step(f"Contaminated message: '{msg_text[:100]}...'", "ERROR")
                            break
                            
                    if contamination_detected:
                        break
                        
                    # Show what message was added
                    for new_msg in current_messages[initial_count:]:
                        new_text = new_msg.text.strip()
                        if new_text:
                            self.log_step(f"New message in User1 chat: '{new_text[:60]}...'", "WARNING")
                else:
                    self.log_step(f"Second {second}: No change in User1 chat (count: {current_count})")
            
            # Final verification
            self.log_step("PHASE 5: Final contamination check")
            
            final_messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='admin-message-']")
            final_contamination = False
            
            for msg in final_messages:
                if unique_message in msg.text:
                    final_contamination = True
                    break
            
            if final_contamination:
                self.log_step("🚨 FINAL RESULT: CONTAMINATION BUG CONFIRMED", "ERROR")
                contamination_detected = True
            else:
                self.log_step("✅ FINAL RESULT: NO CONTAMINATION DETECTED", "SUCCESS")
            
            # Verify message is in User2's conversation
            self.log_step("PHASE 6: Verifying message location")
            
            # Switch admin to User2 conversation
            user2_conv = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='conversation-user2@example.com']")
            user2_conv.click()
            time.sleep(2)
            
            user2_messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='admin-message-']")
            user2_has_message = any(unique_message in msg.text for msg in user2_messages)
            
            if user2_has_message:
                self.log_step("✅ Message correctly found in User2's conversation", "SUCCESS")
            else:
                self.log_step("❌ Message NOT found in User2's conversation", "ERROR")
            
            # Show final results
            print("\n" + "="*80)
            print("🎯 TWO BROWSER TEST RESULTS")
            print("="*80)
            
            if contamination_detected:
                print("❌ BUG REPRODUCED SUCCESSFULLY")
                print(f"   - User2's message '{unique_message}' contaminated User1's chat")
                print("   - This confirms the real-time contamination bug exists")
                print("   - The filtering logic needs additional fixes")
                result = False
            else:
                print("✅ NO CONTAMINATION DETECTED")  
                print(f"   - User2's message '{unique_message}' stayed in correct conversation")
                print("   - Message isolation working correctly")
                print("   - The filtering fix is effective")
                result = True
            
            print("="*80)
            
            # Keep browsers open for manual inspection
            print(f"\n🔍 MANUAL INSPECTION:")
            print(f"Browser 1 (Admin): Currently showing selected conversation")
            print(f"Browser 2 (User2): Chat widget with sent message")
            print(f"Test message to look for: '{unique_message}'")
            print(f"\nBoth browsers will stay open for manual verification...")
            
            try:
                input("\nPress Enter to close both browsers and finish test...")
            except:
                time.sleep(5)  # Auto-close after 5 seconds if no input
                
            return result
            
        except Exception as e:
            self.log_step(f"Test failed with exception: {e}", "ERROR")
            return False
            
        finally:
            # Clean up
            try:
                admin_driver.quit()
                user_driver.quit()
            except:
                pass

if __name__ == "__main__":
    test = TwoBrowserReproduction()
    success = test.reproduce_contamination_bug()
    
    print("\n" + "🎬" * 30)
    if success:
        print("🎉 RESULT: Message isolation working - No contamination bug!")
    else:
        print("🐛 RESULT: Contamination bug reproduced - Needs investigation!")
    print("🎬" * 30)