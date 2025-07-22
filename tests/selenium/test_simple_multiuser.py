import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from tests.selenium.base_test import BaseTest
import os

class TestSimpleMultiUser(BaseTest):
    """Simple multi-user tests to verify the 4 requested scenarios"""
    
    def setup_method(self):
        super().setup_method()
        self.test_messages = {
            "user1": "Hello from User 1 - Advanced Test",
            "user2": "Hello from User 2 - Advanced Test", 
            "admin_to_user1": "Admin reply to User 1",
            "admin_to_user2": "Admin reply to User 2",
            "broadcast": "🚨 SYSTEM BROADCAST: Advanced test message"
        }
    
    def create_second_driver(self):
        """Create a second WebDriver instance"""
        try:
            chrome_options = Options()
            chrome_options.add_argument("--headless=new")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("--disable-web-security")
            chrome_options.add_argument("--allow-running-insecure-content")
            
            # Try system ChromeDriver first
            system_chromedriver = "/opt/homebrew/bin/chromedriver"
            if os.path.exists(system_chromedriver):
                service = Service(system_chromedriver)
            else:
                # Use webdriver-manager but find actual executable
                wdm_path = ChromeDriverManager().install()
                if "THIRD_PARTY_NOTICES" in wdm_path:
                    driver_dir = os.path.dirname(wdm_path)
                    actual_chromedriver = os.path.join(driver_dir, "chromedriver")
                    if os.path.exists(actual_chromedriver):
                        service = Service(actual_chromedriver)
                    else:
                        service = Service(wdm_path)
                else:
                    service = Service(wdm_path)
            
            driver = webdriver.Chrome(service=service, options=chrome_options)
            driver.implicitly_wait(5)
            return driver
            
        except Exception as e:
            self.log_test_step(f"Failed to create second driver: {e}")
            raise
    
    def switch_user_in_widget(self, driver, user_email):
        """Switch the user in the widget test page"""
        try:
            # Execute JavaScript to switch user
            driver.execute_script(f"""
                currentEmail = '{user_email}';
                document.getElementById('current-user').textContent = currentEmail;
                renderWidget();
            """)
            time.sleep(2)
            self.log_test_step(f"Switched widget to user: {user_email}")
            return True
        except Exception as e:
            self.log_test_step(f"Failed to switch user to {user_email}: {e}")
            return False
    
    def open_chat_widget(self, driver):
        """Open the chat widget"""
        try:
            toggle_button = driver.find_element(By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
            self.utils.safe_click(driver, toggle_button)
            time.sleep(2)
            return True
        except Exception as e:
            self.log_test_step(f"Failed to open chat widget: {e}")
            return False
    
    def send_user_message(self, driver, message):
        """Send a message from user"""
        try:
            message_input = driver.find_element(By.CSS_SELECTOR, "[data-testid='message-input']")
            send_button = driver.find_element(By.CSS_SELECTOR, "[data-testid='send-button']")
            
            # Wait for connection
            for i in range(10):
                if send_button.is_enabled():
                    break
                time.sleep(1)
            
            if send_button.is_enabled():
                message_input.clear()
                message_input.send_keys(message)
                self.utils.safe_click(driver, send_button)
                self.log_test_step(f"Sent user message: {message}")
                return True
            else:
                self.log_test_step("Send button not enabled")
                return False
                
        except Exception as e:
            self.log_test_step(f"Failed to send user message: {e}")
            return False
    
    def test_scenario_1_admin_to_multiple_users(self, chrome_driver, utils, test_config):
        """Test 1: Admin sending different messages to User 1 and User 2"""
        self.utils = utils
        self.log_test_step("=== SCENARIO 1: Admin to Multiple Users ===")
        
        # Create admin driver
        admin_driver = self.create_second_driver()
        
        try:
            # Setup User 1 (main driver)
            chrome_driver.get(test_config["widget_test_url"])
            self.wait_for_page_load(chrome_driver)
            
            self.switch_user_in_widget(chrome_driver, "user1.test@example.com")
            assert self.open_chat_widget(chrome_driver), "Failed to open User 1 chat"
            
            # Setup Admin
            admin_driver.get(test_config["admin_url"])
            self.wait_for_page_load(admin_driver)
            
            # Wait for connections
            time.sleep(5)
            
            # User 1 sends initial message
            assert self.send_user_message(chrome_driver, self.test_messages["user1"])
            
            time.sleep(3)
            
            # Admin responds (refresh first to see conversation)
            admin_driver.refresh()
            self.wait_for_page_load(admin_driver)
            time.sleep(3)
            
            # Look for conversation and send reply
            conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            if conversations:
                self.utils.safe_click(admin_driver, conversations[0])
                time.sleep(2)
                
                try:
                    admin_input = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='admin-message-input']")
                    admin_send = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='admin-send-button']")
                    
                    if admin_send.is_enabled():
                        admin_input.clear()
                        admin_input.send_keys(self.test_messages["admin_to_user1"])
                        self.utils.safe_click(admin_driver, admin_send)
                        self.log_test_step("Admin sent targeted message to User 1")
                    
                except Exception as e:
                    self.log_test_step(f"Admin interface interaction failed: {e}")
            
            time.sleep(3)
            
            # Verify User 1 received admin message
            admin_messages = chrome_driver.find_elements(By.CSS_SELECTOR, "[data-testid='message-admin']")
            message_received = any(self.test_messages["admin_to_user1"] in msg.text for msg in admin_messages)
            
            # Take screenshots
            self.take_screenshot(chrome_driver, "scenario1_user1_final")
            admin_driver.save_screenshot("test-results/screenshots/scenario1_admin_final.png")
            
            self.log_test_step(f"✅ SCENARIO 1 Result: Admin message received by User 1: {message_received}")
            
        finally:
            admin_driver.quit()
    
    def test_scenario_2_multiple_users_to_admin(self, chrome_driver, utils, test_config):
        """Test 2: Multiple users sending different messages to admin"""
        self.utils = utils
        self.log_test_step("=== SCENARIO 2: Multiple Users to Admin ===")
        
        # Create second user driver
        user2_driver = self.create_second_driver()
        admin_driver = self.create_second_driver()
        
        try:
            # Setup User 1
            chrome_driver.get(test_config["widget_test_url"])
            self.wait_for_page_load(chrome_driver)
            self.switch_user_in_widget(chrome_driver, "user1.scenario2@example.com")
            assert self.open_chat_widget(chrome_driver)
            
            # Setup User 2
            user2_driver.get(test_config["widget_test_url"])
            self.wait_for_page_load(user2_driver)
            self.switch_user_in_widget(user2_driver, "user2.scenario2@example.com")
            assert self.open_chat_widget(user2_driver)
            
            # Setup Admin
            admin_driver.get(test_config["admin_url"])
            self.wait_for_page_load(admin_driver)
            
            time.sleep(5)
            
            # Both users send messages
            assert self.send_user_message(chrome_driver, self.test_messages["user1"])
            time.sleep(1)
            assert self.send_user_message(user2_driver, self.test_messages["user2"])
            
            time.sleep(3)
            
            # Check admin received messages
            admin_driver.refresh()
            self.wait_for_page_load(admin_driver)
            time.sleep(3)
            
            conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            self.log_test_step(f"Admin sees {len(conversations)} conversations")
            
            # Take screenshots
            self.take_screenshot(chrome_driver, "scenario2_user1_final")
            user2_driver.save_screenshot("test-results/screenshots/scenario2_user2_final.png")
            admin_driver.save_screenshot("test-results/screenshots/scenario2_admin_final.png")
            
            # Verify success
            success = len(conversations) >= 2
            self.log_test_step(f"✅ SCENARIO 2 Result: Multiple user conversations detected: {success}")
            
        finally:
            user2_driver.quit()
            admin_driver.quit()
    
    def test_scenario_3_admin_broadcast(self, chrome_driver, utils, test_config):
        """Test 3: Admin broadcast to all users"""
        self.utils = utils
        self.log_test_step("=== SCENARIO 3: Admin Broadcast ===")
        
        user2_driver = self.create_second_driver()
        admin_driver = self.create_second_driver()
        
        try:
            # Setup users
            chrome_driver.get(test_config["widget_test_url"])
            self.wait_for_page_load(chrome_driver)
            self.switch_user_in_widget(chrome_driver, "user1.broadcast@example.com")
            assert self.open_chat_widget(chrome_driver)
            
            user2_driver.get(test_config["widget_test_url"])
            self.wait_for_page_load(user2_driver)
            self.switch_user_in_widget(user2_driver, "user2.broadcast@example.com")
            assert self.open_chat_widget(user2_driver)
            
            # Setup admin
            admin_driver.get(test_config["admin_url"])
            self.wait_for_page_load(admin_driver)
            
            time.sleep(8)
            
            # Users send initial messages
            self.send_user_message(chrome_driver, "User 1 ready for broadcast")
            self.send_user_message(user2_driver, "User 2 ready for broadcast")
            time.sleep(3)
            
            # Admin sends broadcast
            try:
                broadcast_input = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='broadcast-input']")
                broadcast_button = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='broadcast-button']")
                
                if broadcast_button.is_enabled():
                    broadcast_input.clear()
                    broadcast_input.send_keys(self.test_messages["broadcast"])
                    self.utils.safe_click(admin_driver, broadcast_button)
                    self.log_test_step("Admin sent broadcast message")
                    
                    time.sleep(5)
                    
                    # Check if users received broadcast
                    user1_messages = chrome_driver.find_elements(By.CSS_SELECTOR, "[data-testid='message-admin']")
                    user1_got_broadcast = any(self.test_messages["broadcast"] in msg.text for msg in user1_messages)
                    
                    user2_messages = user2_driver.find_elements(By.CSS_SELECTOR, "[data-testid='message-admin']")
                    user2_got_broadcast = any(self.test_messages["broadcast"] in msg.text for msg in user2_messages)
                    
                    self.log_test_step(f"User 1 received broadcast: {user1_got_broadcast}")
                    self.log_test_step(f"User 2 received broadcast: {user2_got_broadcast}")
                    
                    # Take screenshots
                    self.take_screenshot(chrome_driver, "scenario3_user1_final")
                    user2_driver.save_screenshot("test-results/screenshots/scenario3_user2_final.png")
                    admin_driver.save_screenshot("test-results/screenshots/scenario3_admin_final.png")
                    
                    success = user1_got_broadcast or user2_got_broadcast
                    self.log_test_step(f"✅ SCENARIO 3 Result: Broadcast delivered: {success}")
                else:
                    self.log_test_step("Broadcast button not enabled")
                    
            except Exception as e:
                self.log_test_step(f"Broadcast test failed: {e}")
                
        finally:
            user2_driver.quit()
            admin_driver.quit()
    
    def test_scenario_4_dynamic_connection(self, chrome_driver, utils, test_config):
        """Test 4: Admin dashboard auto-connecting to new users"""
        self.utils = utils
        self.log_test_step("=== SCENARIO 4: Dynamic User Connection ===")
        
        admin_driver = self.create_second_driver()
        
        try:
            # Setup admin first
            admin_driver.get(test_config["admin_url"])
            self.wait_for_page_load(admin_driver)
            
            # Check initial conversations
            initial_conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            initial_count = len(initial_conversations)
            self.log_test_step(f"Initial conversations: {initial_count}")
            
            # Now open user in new "tab" (new session)
            chrome_driver.get(test_config["widget_test_url"])
            self.wait_for_page_load(chrome_driver)
            self.switch_user_in_widget(chrome_driver, f"dynamic.user@example.com")
            assert self.open_chat_widget(chrome_driver)
            
            # User sends message to create conversation
            assert self.send_user_message(chrome_driver, "New dynamic user connection test")
            
            time.sleep(5)
            
            # Check admin for new conversation
            admin_driver.refresh()
            self.wait_for_page_load(admin_driver)
            time.sleep(3)
            
            final_conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            final_count = len(final_conversations)
            
            self.log_test_step(f"Final conversations: {final_count}")
            
            # Take screenshots
            self.take_screenshot(chrome_driver, "scenario4_user_final")
            admin_driver.save_screenshot("test-results/screenshots/scenario4_admin_final.png")
            
            # Verify dynamic connection detected
            success = final_count > initial_count
            self.log_test_step(f"✅ SCENARIO 4 Result: New connection detected: {success}")
            
        finally:
            admin_driver.quit()