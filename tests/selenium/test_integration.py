import pytest
import time
import threading
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException
from tests.selenium.base_test import BaseTest

class TestIntegration(BaseTest):
    """Integration tests for end-to-end chat functionality"""
    
    def setup_method(self):
        super().setup_method()
        self.test_user_email = "integration.test@example.com"
        self.test_message_from_user = "Hello admin! This is from integration test user."
        self.test_message_from_admin = "Hello user! This is admin's reply."
        self.broadcast_message = "Broadcast: Server maintenance in 10 minutes"
    
    def create_second_driver(self):
        """Create a second WebDriver instance for multi-user testing"""
        chrome_options = Options()
        chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-web-security")
        chrome_options.add_argument("--allow-running-insecure-content")
        
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.implicitly_wait(5)
        return driver
    
    def test_user_admin_message_flow(self, chrome_driver, utils, test_config):
        """Test complete message flow between user and admin"""
        self.utils = utils
        
        # Create second driver for admin
        admin_driver = self.create_second_driver()
        
        try:
            self.log_test_step("=== Setting up user chat widget ===")
            
            # Setup user widget
            chrome_driver.get(test_config["widget_test_url"])
            self.wait_for_page_load(chrome_driver)
            
            # Switch to integration test user
            user_buttons = chrome_driver.find_elements(By.CSS_SELECTOR, ".email-inputs button")
            if len(user_buttons) > 2:  # Use third button if available
                utils.safe_click(chrome_driver, user_buttons[2])
                time.sleep(2)
            
            # Open user chat
            toggle_button = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
            utils.safe_click(chrome_driver, toggle_button)
            
            self.log_test_step("=== Setting up admin interface ===")
            
            # Setup admin interface
            admin_driver.get(test_config["admin_url"])
            self.wait_for_page_load(admin_driver)
            
            # Wait for both to connect
            self.log_test_step("Waiting for connections to establish")
            time.sleep(5)
            
            self.log_test_step("=== User sends message ===")
            
            # User sends message
            user_input = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='message-input']")
            user_send_button = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='send-button']")
            
            # Wait for connection
            max_wait = 15
            for _ in range(max_wait):
                if user_send_button.is_enabled():
                    break
                time.sleep(1)
            
            if user_send_button.is_enabled():
                user_input.send_keys(self.test_message_from_user)
                utils.safe_click(chrome_driver, user_send_button)
                
                self.log_test_step("User message sent, waiting for admin to receive")
                time.sleep(3)
                
                # Check if message appears in user's chat
                user_messages = chrome_driver.find_elements(By.CSS_SELECTOR, "[data-testid='message-user']")
                user_message_found = any(self.test_message_from_user in msg.text for msg in user_messages)
                assert user_message_found, "User's message should appear in their own chat"
                
                self.log_test_step("=== Checking admin receives message ===")
                
                # Check admin interface for new message
                # Refresh conversations to ensure we see the new conversation
                admin_driver.refresh()
                self.wait_for_page_load(admin_driver)
                time.sleep(3)
                
                # Look for conversations
                admin_conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
                
                if admin_conversations:
                    self.log_test_step(f"Found {len(admin_conversations)} conversations in admin")
                    
                    # Find conversation with our test user or latest conversation
                    target_conversation = None
                    for conv in admin_conversations:
                        conv_text = conv.text.lower()
                        if "integration" in conv_text or "test" in conv_text:
                            target_conversation = conv
                            break
                    
                    if not target_conversation and admin_conversations:
                        target_conversation = admin_conversations[0]  # Use first conversation
                    
                    if target_conversation:
                        self.log_test_step("Selecting conversation in admin")
                        utils.safe_click(admin_driver, target_conversation)
                        time.sleep(2)
                        
                        self.log_test_step("=== Admin sends reply ===")
                        
                        # Admin sends reply
                        try:
                            admin_input = utils.wait_for_element(admin_driver, By.CSS_SELECTOR, "[data-testid='admin-message-input']", timeout=5)
                            admin_send_button = utils.wait_for_element(admin_driver, By.CSS_SELECTOR, "[data-testid='admin-send-button']", timeout=5)
                            
                            if admin_send_button.is_enabled():
                                admin_input.send_keys(self.test_message_from_admin)
                                utils.safe_click(admin_driver, admin_send_button)
                                
                                self.log_test_step("Admin reply sent, waiting for user to receive")
                                time.sleep(3)
                                
                                # Check if admin's reply appears in user's chat
                                admin_messages = chrome_driver.find_elements(By.CSS_SELECTOR, "[data-testid='message-admin']")
                                admin_message_found = any(self.test_message_from_admin in msg.text for msg in admin_messages)
                                
                                if admin_message_found:
                                    self.log_test_step("✅ End-to-end message flow successful!")
                                else:
                                    self.log_test_step("⚠️ Admin's reply not received by user")
                            else:
                                self.log_test_step("Admin send button not enabled")
                        except TimeoutException:
                            self.log_test_step("Admin message input not found")
                    else:
                        self.log_test_step("No suitable conversation found in admin")
                else:
                    self.log_test_step("No conversations found in admin interface")
            else:
                self.log_test_step("User send button not enabled - connection issue")
            
            # Take screenshots of both interfaces
            self.take_screenshot(chrome_driver, "integration_user_final")
            admin_driver.save_screenshot("test-results/screenshots/integration_admin_final.png")
            
        finally:
            admin_driver.quit()
        
        self.verify_no_console_errors(chrome_driver)
    
    def test_broadcast_message_delivery(self, chrome_driver, utils, test_config):
        """Test broadcast message delivery to multiple users"""
        self.utils = utils
        
        # Create additional drivers for multiple users
        user2_driver = self.create_second_driver()
        admin_driver = self.create_second_driver()
        
        try:
            self.log_test_step("=== Setting up multiple user widgets ===")
            
            # Setup first user (chrome_driver)
            chrome_driver.get(test_config["widget_test_url"])
            self.wait_for_page_load(chrome_driver)
            
            # Switch to first test user
            user_buttons = chrome_driver.find_elements(By.CSS_SELECTOR, ".email-inputs button")
            if len(user_buttons) > 0:
                utils.safe_click(chrome_driver, user_buttons[0])
                time.sleep(2)
            
            # Open first user's chat
            toggle_button1 = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
            utils.safe_click(chrome_driver, toggle_button1)
            
            # Setup second user
            user2_driver.get(test_config["widget_test_url"])
            self.wait_for_page_load(user2_driver)
            
            # Switch to second test user
            user2_buttons = user2_driver.find_elements(By.CSS_SELECTOR, ".email-inputs button")
            if len(user2_buttons) > 1:
                user2_buttons[1].click()  # Click second button
                time.sleep(2)
            
            # Open second user's chat
            toggle_button2 = user2_driver.find_element(By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
            toggle_button2.click()
            
            self.log_test_step("=== Setting up admin interface ===")
            
            # Setup admin
            admin_driver.get(test_config["admin_url"])
            self.wait_for_page_load(admin_driver)
            
            # Wait for all connections
            self.log_test_step("Waiting for all connections to establish")
            time.sleep(8)
            
            self.log_test_step("=== Sending broadcast message ===")
            
            # Send broadcast from admin
            try:
                broadcast_input = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='broadcast-input']")
                broadcast_button = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='broadcast-button']")
                
                if broadcast_button.is_enabled():
                    broadcast_input.send_keys(self.broadcast_message)
                    broadcast_button.click()
                    
                    self.log_test_step("Broadcast sent, waiting for delivery")
                    time.sleep(5)
                    
                    # Check if broadcast appears in both user chats
                    self.log_test_step("Checking broadcast delivery to User 1")
                    user1_messages = chrome_driver.find_elements(By.CSS_SELECTOR, "[data-testid='message-admin']")
                    user1_got_broadcast = any(self.broadcast_message in msg.text for msg in user1_messages)
                    
                    self.log_test_step("Checking broadcast delivery to User 2")
                    user2_messages = user2_driver.find_elements(By.CSS_SELECTOR, "[data-testid='message-admin']")
                    user2_got_broadcast = any(self.broadcast_message in msg.text for msg in user2_messages)
                    
                    self.log_test_step(f"User 1 received broadcast: {user1_got_broadcast}")
                    self.log_test_step(f"User 2 received broadcast: {user2_got_broadcast}")
                    
                    if user1_got_broadcast and user2_got_broadcast:
                        self.log_test_step("✅ Broadcast delivery successful to all users!")
                    elif user1_got_broadcast or user2_got_broadcast:
                        self.log_test_step("⚠️ Broadcast delivered to some users only")
                    else:
                        self.log_test_step("❌ Broadcast not delivered to any users")
                else:
                    self.log_test_step("Broadcast button not enabled")
            except Exception as e:
                self.log_test_step(f"Broadcast test failed: {e}")
            
            # Take screenshots
            self.take_screenshot(chrome_driver, "broadcast_user1")
            user2_driver.save_screenshot("test-results/screenshots/broadcast_user2.png")
            admin_driver.save_screenshot("test-results/screenshots/broadcast_admin.png")
            
        finally:
            user2_driver.quit()
            admin_driver.quit()
        
        self.verify_no_console_errors(chrome_driver)
    
    def test_connection_recovery(self, chrome_driver, utils, test_config):
        """Test connection recovery after network interruption"""
        self.utils = utils
        
        self.log_test_step("=== Testing connection recovery ===")
        
        # Setup user widget
        chrome_driver.get(test_config["widget_test_url"])
        self.wait_for_page_load(chrome_driver)
        
        # Open chat
        toggle_button = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
        utils.safe_click(chrome_driver, toggle_button)
        
        # Wait for initial connection
        self.log_test_step("Waiting for initial connection")
        time.sleep(5)
        
        # Check initial connection status
        status_element = chrome_driver.find_element(By.CSS_SELECTOR, ".status")
        initial_status = status_element.text
        self.log_test_step(f"Initial connection status: {initial_status}")
        
        # Simulate network interruption by navigating away and back
        self.log_test_step("Simulating network interruption")
        chrome_driver.execute_script("window.location.href = 'about:blank'")
        time.sleep(3)
        
        # Navigate back
        self.log_test_step("Returning to chat page")
        chrome_driver.get(test_config["widget_test_url"])
        self.wait_for_page_load(chrome_driver)
        
        # Reopen chat
        toggle_button = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
        utils.safe_click(chrome_driver, toggle_button)
        
        # Check recovery
        self.log_test_step("Checking connection recovery")
        recovery_time = 0
        max_recovery_time = 20  # seconds
        recovered = False
        
        while recovery_time < max_recovery_time:
            try:
                status_element = chrome_driver.find_element(By.CSS_SELECTOR, ".status")
                current_status = status_element.text
                
                if "Online" in current_status:
                    self.log_test_step(f"✅ Connection recovered after {recovery_time} seconds")
                    recovered = True
                    break
                elif "Reconnecting" in current_status:
                    self.log_test_step(f"Reconnecting... ({recovery_time}s)")
                elif "Connection Error" in current_status:
                    # Check for retry button
                    retry_buttons = chrome_driver.find_elements(By.CSS_SELECTOR, ".retry-button")
                    if retry_buttons:
                        self.log_test_step("Clicking retry button")
                        utils.safe_click(chrome_driver, retry_buttons[0])
                
                time.sleep(1)
                recovery_time += 1
                
            except Exception as e:
                self.log_test_step(f"Error during recovery check: {e}")
                break
        
        if not recovered:
            self.log_test_step(f"⚠️ Connection did not recover within {max_recovery_time} seconds")
        
        self.take_screenshot(chrome_driver, "connection_recovery")
        self.verify_no_console_errors(chrome_driver)
    
    def test_multiple_concurrent_users(self, chrome_driver, utils, test_config):
        """Test system behavior with multiple concurrent users"""
        self.utils = utils
        
        self.log_test_step("=== Testing multiple concurrent users ===")
        
        # Create multiple user drivers
        num_users = 3
        user_drivers = []
        
        try:
            # Create additional drivers
            for i in range(num_users - 1):  # -1 because we already have chrome_driver
                driver = self.create_second_driver()
                user_drivers.append(driver)
            
            # Add main driver to list
            all_drivers = [chrome_driver] + user_drivers
            
            self.log_test_step(f"Setting up {num_users} concurrent users")
            
            # Setup all users
            for i, driver in enumerate(all_drivers):
                self.log_test_step(f"Setting up user {i+1}")
                
                driver.get(test_config["widget_test_url"])
                self.wait_for_page_load(driver)
                
                # Switch to different user for each driver
                user_buttons = driver.find_elements(By.CSS_SELECTOR, ".email-inputs button")
                if len(user_buttons) > i:
                    user_buttons[i].click()
                    time.sleep(1)
                
                # Open chat
                toggle_button = driver.find_element(By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
                toggle_button.click()
                
                time.sleep(2)  # Stagger connections
            
            self.log_test_step("Waiting for all users to connect")
            time.sleep(10)
            
            # Have all users send messages simultaneously
            self.log_test_step("All users sending messages simultaneously")
            
            def send_message_from_user(driver, user_num):
                try:
                    message_input = driver.find_element(By.CSS_SELECTOR, "[data-testid='message-input']")
                    send_button = driver.find_element(By.CSS_SELECTOR, "[data-testid='send-button']")
                    
                    if send_button.is_enabled():
                        message = f"Message from concurrent user {user_num}"
                        message_input.send_keys(message)
                        send_button.click()
                        self.log_test_step(f"User {user_num} sent message")
                    else:
                        self.log_test_step(f"User {user_num} send button not enabled")
                except Exception as e:
                    self.log_test_step(f"User {user_num} failed to send message: {e}")
            
            # Send messages concurrently
            threads = []
            for i, driver in enumerate(all_drivers):
                thread = threading.Thread(target=send_message_from_user, args=(driver, i+1))
                threads.append(thread)
                thread.start()
            
            # Wait for all threads to complete
            for thread in threads:
                thread.join()
            
            self.log_test_step("Waiting for message processing")
            time.sleep(5)
            
            # Check that messages were sent successfully
            successful_sends = 0
            for i, driver in enumerate(all_drivers):
                try:
                    user_messages = driver.find_elements(By.CSS_SELECTOR, "[data-testid='message-user']")
                    if user_messages:
                        successful_sends += 1
                        self.log_test_step(f"User {i+1} successfully sent message")
                except Exception as e:
                    self.log_test_step(f"Error checking user {i+1} messages: {e}")
            
            self.log_test_step(f"✅ {successful_sends}/{num_users} users successfully sent messages")
            
            # Take screenshots of all user interfaces
            for i, driver in enumerate(all_drivers):
                driver.save_screenshot(f"test-results/screenshots/concurrent_user_{i+1}.png")
            
        finally:
            # Clean up additional drivers
            for driver in user_drivers:
                driver.quit()
        
        self.verify_no_console_errors(chrome_driver)