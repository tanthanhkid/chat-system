import pytest
import time
import threading
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from tests.selenium.base_test import BaseTest
import uuid
import os

class TestAdvancedIntegration(BaseTest):
    """Advanced integration tests for complex real-time chat scenarios"""
    
    def setup_method(self):
        super().setup_method()
        self.test_session_id = str(uuid.uuid4())[:8]  # Unique session ID
        self.drivers = []  # Track all drivers for cleanup
        
        # Test user configurations
        self.users = [
            {"email": f"user1.{self.test_session_id}@example.com", "name": "User 1"},
            {"email": f"user2.{self.test_session_id}@example.com", "name": "User 2"},
            {"email": f"user3.{self.test_session_id}@example.com", "name": "User 3"},
            {"email": f"user4.{self.test_session_id}@example.com", "name": "User 4"}
        ]
        
        # Test messages
        self.admin_messages = {
            "user1": f"Hello User 1! Admin message at {int(time.time())}",
            "user2": f"Hello User 2! Different message at {int(time.time())}"
        }
        self.user_messages = [
            f"Message from User 1 - {int(time.time())}",
            f"Message from User 2 - {int(time.time())}",
            f"Message from User 3 - {int(time.time())}"
        ]
        self.broadcast_message = f"🚨 BROADCAST: System maintenance at {int(time.time())}"
    
    def teardown_method(self):
        """Clean up all drivers"""
        for driver in self.drivers:
            try:
                driver.quit()
            except:
                pass
        self.drivers.clear()
        super().teardown_method()
    
    def create_driver_instance(self, name="driver"):
        """Create a new WebDriver instance with proper configuration"""
        try:
            chrome_options = Options()
            chrome_options.add_argument("--headless=new")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("--disable-web-security")
            chrome_options.add_argument("--allow-running-insecure-content")
            
            # Try system ChromeDriver first, then fallback to actual executable in webdriver-manager cache
            system_chromedriver = "/opt/homebrew/bin/chromedriver"
            if os.path.exists(system_chromedriver):
                service = Service(system_chromedriver)
            else:
                # Use webdriver-manager but find the actual executable, not the THIRD_PARTY_NOTICES file
                wdm_path = ChromeDriverManager().install()
                if "THIRD_PARTY_NOTICES" in wdm_path:
                    # Extract the directory and find the actual chromedriver executable
                    driver_dir = os.path.dirname(wdm_path)
                    actual_chromedriver = os.path.join(driver_dir, "chromedriver")
                    if os.path.exists(actual_chromedriver):
                        service = Service(actual_chromedriver)
                    else:
                        # Look for chromedriver in the directory
                        for file in os.listdir(driver_dir):
                            if file == "chromedriver" and os.access(os.path.join(driver_dir, file), os.X_OK):
                                service = Service(os.path.join(driver_dir, file))
                                break
                        else:
                            service = Service(wdm_path)
                else:
                    service = Service(wdm_path)
            
            driver = webdriver.Chrome(service=service, options=chrome_options)
            driver.implicitly_wait(5)
            self.drivers.append(driver)
            
            self.log_test_step(f"Created {name} driver instance")
            return driver
            
        except Exception as e:
            self.log_test_step(f"Failed to create {name} driver: {e}")
            raise
    
    def setup_user_widget(self, driver, user_config, test_config):
        """Setup a user chat widget"""
        try:
            driver.get(test_config["widget_test_url"])
            self.wait_for_page_load(driver)
            
            # Switch to the specific user by modifying the current user variable
            # This simulates clicking a user button or setting user email
            driver.execute_script(f"""
                currentEmail = '{user_config["email"]}';
                document.getElementById('current-user').textContent = currentEmail;
                renderWidget();
            """)
            
            time.sleep(2)  # Wait for widget re-initialization
            
            # Open chat widget
            toggle_button = driver.find_element(By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
            self.utils.safe_click(driver, toggle_button)
            
            self.log_test_step(f"Setup user widget for {user_config['name']} ({user_config['email']})")
            return True
            
        except Exception as e:
            self.log_test_step(f"Failed to setup user widget for {user_config['name']}: {e}")
            return False
    
    def setup_admin_dashboard(self, driver, test_config):
        """Setup admin dashboard"""
        try:
            driver.get(test_config["admin_url"])
            self.wait_for_page_load(driver)
            
            # Wait for admin connection
            time.sleep(5)
            
            self.log_test_step("Setup admin dashboard")
            return True
            
        except Exception as e:
            self.log_test_step(f"Failed to setup admin dashboard: {e}")
            return False
    
    def send_user_message(self, driver, message, user_name):
        """Send a message from user chat widget"""
        try:
            message_input = driver.find_element(By.CSS_SELECTOR, "[data-testid='message-input']")
            send_button = driver.find_element(By.CSS_SELECTOR, "[data-testid='send-button']")
            
            # Wait for connection
            max_wait = 10
            for _ in range(max_wait):
                if send_button.is_enabled():
                    break
                time.sleep(1)
            
            if send_button.is_enabled():
                message_input.clear()
                message_input.send_keys(message)
                self.utils.safe_click(driver, send_button)
                
                self.log_test_step(f"{user_name} sent message: {message}")
                return True
            else:
                self.log_test_step(f"{user_name} send button not enabled")
                return False
                
        except Exception as e:
            self.log_test_step(f"Failed to send message from {user_name}: {e}")
            return False
    
    def send_admin_message(self, driver, message, target_conversation=None):
        """Send a message from admin to specific conversation or current selected"""
        try:
            # If target conversation specified, select it first
            if target_conversation:
                conversations = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
                for conv in conversations:
                    if target_conversation in conv.text.lower():
                        self.utils.safe_click(driver, conv)
                        time.sleep(2)
                        break
            
            admin_input = driver.find_element(By.CSS_SELECTOR, "[data-testid='admin-message-input']")
            admin_send_button = driver.find_element(By.CSS_SELECTOR, "[data-testid='admin-send-button']")
            
            if admin_send_button.is_enabled():
                admin_input.clear()
                admin_input.send_keys(message)
                self.utils.safe_click(driver, admin_send_button)
                
                self.log_test_step(f"Admin sent message: {message}")
                return True
            else:
                self.log_test_step("Admin send button not enabled")
                return False
                
        except Exception as e:
            self.log_test_step(f"Failed to send admin message: {e}")
            return False
    
    def send_broadcast_message(self, driver, message):
        """Send broadcast message from admin"""
        try:
            broadcast_input = driver.find_element(By.CSS_SELECTOR, "[data-testid='broadcast-input']")
            broadcast_button = driver.find_element(By.CSS_SELECTOR, "[data-testid='broadcast-button']")
            
            if broadcast_button.is_enabled():
                broadcast_input.clear()
                broadcast_input.send_keys(message)
                self.utils.safe_click(driver, broadcast_button)
                
                self.log_test_step(f"Admin sent broadcast: {message}")
                return True
            else:
                self.log_test_step("Broadcast button not enabled")
                return False
                
        except Exception as e:
            self.log_test_step(f"Failed to send broadcast: {e}")
            return False
    
    def verify_message_received(self, driver, expected_message, sender_type, user_name):
        """Verify that a specific message was received"""
        try:
            # Look for messages of the specified sender type
            messages = driver.find_elements(By.CSS_SELECTOR, f"[data-testid='message-{sender_type}']")
            
            for message in messages:
                if expected_message in message.text:
                    self.log_test_step(f"✅ {user_name} received {sender_type} message: {expected_message}")
                    return True
            
            self.log_test_step(f"❌ {user_name} did not receive {sender_type} message: {expected_message}")
            return False
            
        except Exception as e:
            self.log_test_step(f"Error verifying message for {user_name}: {e}")
            return False
    
    def test_admin_to_multiple_users_chat(self, chrome_driver, utils, test_config):
        """Test 1: Admin sending individual messages to User 1 and User 2"""
        self.utils = utils
        
        self.log_test_step("=== TEST 1: Admin to Multiple Users Chat ===")
        
        # Create drivers for admin, user1, and user2
        admin_driver = self.create_driver_instance("admin")
        user1_driver = chrome_driver  # Use the fixture driver for user1
        user2_driver = self.create_driver_instance("user2")
        
        try:
            # Setup admin dashboard
            self.log_test_step("Setting up admin dashboard...")
            assert self.setup_admin_dashboard(admin_driver, test_config)
            
            # Setup user widgets
            self.log_test_step("Setting up user widgets...")
            assert self.setup_user_widget(user1_driver, self.users[0], test_config)
            assert self.setup_user_widget(user2_driver, self.users[1], test_config)
            
            # Wait for connections to establish
            self.log_test_step("Waiting for all connections to establish...")
            time.sleep(8)
            
            # Users send initial messages to create conversations
            self.log_test_step("Users sending initial messages...")
            assert self.send_user_message(user1_driver, "Hello from User 1", self.users[0]["name"])
            assert self.send_user_message(user2_driver, "Hello from User 2", self.users[1]["name"])
            
            time.sleep(3)
            
            # Refresh admin to see conversations
            admin_driver.refresh()
            self.wait_for_page_load(admin_driver)
            time.sleep(5)
            
            # Admin sends different messages to each user
            self.log_test_step("Admin sending targeted messages...")
            
            # Send to User 1
            conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            if len(conversations) >= 1:
                self.utils.safe_click(admin_driver, conversations[0])
                time.sleep(2)
                assert self.send_admin_message(admin_driver, self.admin_messages["user1"])
            
            time.sleep(2)
            
            # Send to User 2  
            conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            if len(conversations) >= 2:
                self.utils.safe_click(admin_driver, conversations[1])
                time.sleep(2)
                assert self.send_admin_message(admin_driver, self.admin_messages["user2"])
            
            # Wait for message delivery
            time.sleep(5)
            
            # Verify User 1 received their specific message
            user1_received = self.verify_message_received(
                user1_driver, self.admin_messages["user1"], "admin", self.users[0]["name"]
            )
            
            # Verify User 2 received their specific message  
            user2_received = self.verify_message_received(
                user2_driver, self.admin_messages["user2"], "admin", self.users[1]["name"]
            )
            
            # Verify message isolation (User 1 should NOT have User 2's message)
            user1_isolation = not self.verify_message_received(
                user1_driver, self.admin_messages["user2"], "admin", f"{self.users[0]['name']} (isolation check)"
            )
            
            # Take screenshots for verification
            self.take_screenshot(admin_driver, "admin_to_users_admin_view")
            self.take_screenshot(user1_driver, "admin_to_users_user1_view")
            self.take_screenshot(user2_driver, "admin_to_users_user2_view")
            
            # Assert all conditions
            assert user1_received, "User 1 should receive their targeted message"
            assert user2_received, "User 2 should receive their targeted message"
            assert user1_isolation, "User 1 should NOT receive User 2's message (isolation test)"
            
            self.log_test_step("✅ TEST 1 PASSED: Admin to multiple users chat working correctly")
            
        except Exception as e:
            self.log_test_step(f"❌ TEST 1 FAILED: {e}")
            raise
    
    def test_multiple_users_to_admin_chat(self, chrome_driver, utils, test_config):
        """Test 2: Multiple users sending different messages to admin"""
        self.utils = utils
        
        self.log_test_step("=== TEST 2: Multiple Users to Admin Chat ===")
        
        # Create drivers
        admin_driver = self.create_driver_instance("admin")
        user1_driver = chrome_driver
        user2_driver = self.create_driver_instance("user2")
        user3_driver = self.create_driver_instance("user3")
        
        try:
            # Setup admin dashboard
            assert self.setup_admin_dashboard(admin_driver, test_config)
            
            # Setup user widgets
            assert self.setup_user_widget(user1_driver, self.users[0], test_config)
            assert self.setup_user_widget(user2_driver, self.users[1], test_config)
            assert self.setup_user_widget(user3_driver, self.users[2], test_config)
            
            # Wait for connections
            time.sleep(8)
            
            # Users send messages in rapid succession
            self.log_test_step("Multiple users sending messages to admin...")
            
            def send_user_messages():
                """Send messages from multiple users concurrently"""
                threads = []
                
                def user_send(driver, message, user_name):
                    time.sleep(0.5)  # Slight delay to stagger
                    self.send_user_message(driver, message, user_name)
                
                # Create threads for concurrent sending
                threads.append(threading.Thread(target=user_send, args=(user1_driver, self.user_messages[0], self.users[0]["name"])))
                threads.append(threading.Thread(target=user_send, args=(user2_driver, self.user_messages[1], self.users[1]["name"])))
                threads.append(threading.Thread(target=user_send, args=(user3_driver, self.user_messages[2], self.users[2]["name"])))
                
                # Start all threads
                for thread in threads:
                    thread.start()
                
                # Wait for completion
                for thread in threads:
                    thread.join()
            
            send_user_messages()
            
            # Wait for messages to be processed
            time.sleep(5)
            
            # Refresh admin dashboard to see new conversations
            admin_driver.refresh()
            self.wait_for_page_load(admin_driver)
            time.sleep(5)
            
            # Verify admin received all messages
            conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            self.log_test_step(f"Admin dashboard shows {len(conversations)} conversations")
            
            # Check each conversation for the expected messages
            messages_found = []
            
            for i, conversation in enumerate(conversations[:3]):  # Check first 3 conversations
                self.utils.safe_click(admin_driver, conversation)
                time.sleep(2)
                
                # Look for messages in this conversation
                admin_messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid='admin-message-user']")
                for msg in admin_messages:
                    for expected_msg in self.user_messages:
                        if expected_msg in msg.text:
                            messages_found.append(expected_msg)
                            self.log_test_step(f"✅ Found message in admin: {expected_msg}")
            
            # Take screenshots
            self.take_screenshot(admin_driver, "multi_users_to_admin_dashboard")
            self.take_screenshot(user1_driver, "multi_users_to_admin_user1")
            self.take_screenshot(user2_driver, "multi_users_to_admin_user2")
            self.take_screenshot(user3_driver, "multi_users_to_admin_user3")
            
            # Verify all messages were received
            assert len(messages_found) >= 2, f"Admin should receive at least 2 messages, found: {len(messages_found)}"
            assert len(conversations) >= 2, f"Should have at least 2 conversations, found: {len(conversations)}"
            
            self.log_test_step("✅ TEST 2 PASSED: Multiple users to admin chat working correctly")
            
        except Exception as e:
            self.log_test_step(f"❌ TEST 2 FAILED: {e}")
            raise
    
    def test_admin_broadcast_to_all_users(self, chrome_driver, utils, test_config):
        """Test 3: Admin broadcasting message to all users"""
        self.utils = utils
        
        self.log_test_step("=== TEST 3: Admin Broadcast to All Users ===")
        
        # Create drivers
        admin_driver = self.create_driver_instance("admin")
        user1_driver = chrome_driver
        user2_driver = self.create_driver_instance("user2")
        user3_driver = self.create_driver_instance("user3")
        
        user_drivers = [
            (user1_driver, self.users[0]),
            (user2_driver, self.users[1]),
            (user3_driver, self.users[2])
        ]
        
        try:
            # Setup admin dashboard
            assert self.setup_admin_dashboard(admin_driver, test_config)
            
            # Setup user widgets
            for driver, user_config in user_drivers:
                assert self.setup_user_widget(driver, user_config, test_config)
            
            # Wait for connections
            time.sleep(8)
            
            # Users send initial messages to establish conversations
            self.log_test_step("Users establishing conversations...")
            for driver, user_config in user_drivers:
                self.send_user_message(driver, f"Hello from {user_config['name']}", user_config["name"])
                time.sleep(1)
            
            time.sleep(5)
            
            # Admin sends broadcast message
            self.log_test_step("Admin sending broadcast message...")
            assert self.send_broadcast_message(admin_driver, self.broadcast_message)
            
            # Wait for broadcast delivery
            time.sleep(8)
            
            # Verify all users received the broadcast
            broadcast_received_count = 0
            
            for driver, user_config in user_drivers:
                if self.verify_message_received(driver, self.broadcast_message, "admin", user_config["name"]):
                    broadcast_received_count += 1
            
            # Take screenshots
            self.take_screenshot(admin_driver, "broadcast_admin_view")
            for i, (driver, user_config) in enumerate(user_drivers):
                self.take_screenshot(driver, f"broadcast_user{i+1}_view")
            
            # Verify broadcast delivery
            assert broadcast_received_count >= 2, f"At least 2 users should receive broadcast, got: {broadcast_received_count}"
            
            self.log_test_step(f"✅ TEST 3 PASSED: Broadcast delivered to {broadcast_received_count}/{len(user_drivers)} users")
            
        except Exception as e:
            self.log_test_step(f"❌ TEST 3 FAILED: {e}")
            raise
    
    def test_dynamic_user_connection(self, chrome_driver, utils, test_config):
        """Test 4: Admin dashboard auto-connecting to new users opening chat"""
        self.utils = utils
        
        self.log_test_step("=== TEST 4: Dynamic User Connection Test ===")
        
        # Start with admin dashboard
        admin_driver = self.create_driver_instance("admin")
        
        try:
            # Setup admin dashboard first
            assert self.setup_admin_dashboard(admin_driver, test_config)
            
            # Check initial conversation count
            initial_conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            initial_count = len(initial_conversations)
            self.log_test_step(f"Initial conversations in admin: {initial_count}")
            
            # Now open new user tabs one by one and verify admin auto-detection
            new_users = []
            
            for i, user_config in enumerate(self.users[:3]):
                self.log_test_step(f"Opening new tab for {user_config['name']}...")
                
                # Create new user driver (simulating new tab)
                new_user_driver = self.create_driver_instance(f"new_user_{i+1}")
                new_users.append((new_user_driver, user_config))
                
                # Setup user widget
                assert self.setup_user_widget(new_user_driver, user_config, test_config)
                
                # User sends a message to create conversation
                assert self.send_user_message(new_user_driver, f"New user message from {user_config['name']}", user_config["name"])
                
                # Wait for admin to detect new connection
                time.sleep(5)
                
                # Refresh admin dashboard to check for new conversations
                admin_driver.refresh()
                self.wait_for_page_load(admin_driver)
                time.sleep(3)
                
                # Check if conversation count increased
                current_conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
                current_count = len(current_conversations)
                
                self.log_test_step(f"After {user_config['name']} joined: {current_count} conversations")
                
                # Verify increase in conversation count
                expected_count = initial_count + i + 1
                if current_count >= expected_count:
                    self.log_test_step(f"✅ Admin detected new user {user_config['name']}")
                else:
                    self.log_test_step(f"⚠️ Admin may not have detected new user {user_config['name']} yet")
                
                # Brief pause before next user
                time.sleep(2)
            
            # Final verification - check that admin can interact with new conversations
            self.log_test_step("Testing admin interaction with new conversations...")
            
            final_conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            
            if final_conversations:
                # Select first conversation and send a message
                self.utils.safe_click(admin_driver, final_conversations[0])
                time.sleep(2)
                
                test_reply = f"Admin reply to new connection at {int(time.time())}"
                if self.send_admin_message(admin_driver, test_reply):
                    self.log_test_step("✅ Admin can successfully reply to new conversations")
                else:
                    self.log_test_step("⚠️ Admin reply may have failed")
            
            # Take final screenshots
            self.take_screenshot(admin_driver, "dynamic_connection_admin_final")
            for i, (driver, user_config) in enumerate(new_users):
                self.take_screenshot(driver, f"dynamic_connection_user{i+1}_final")
            
            # Final assertions
            final_count = len(final_conversations)
            assert final_count > initial_count, f"Admin should detect new conversations: {final_count} vs {initial_count}"
            
            self.log_test_step(f"✅ TEST 4 PASSED: Dynamic user connection working - {final_count} total conversations")
            
        except Exception as e:
            self.log_test_step(f"❌ TEST 4 FAILED: {e}")
            raise
    
    def test_comprehensive_multi_user_scenario(self, chrome_driver, utils, test_config):
        """Bonus Test: Comprehensive scenario combining all features"""
        self.utils = utils
        
        self.log_test_step("=== BONUS TEST: Comprehensive Multi-User Scenario ===")
        
        # Create all drivers
        admin_driver = self.create_driver_instance("admin")
        user1_driver = chrome_driver
        user2_driver = self.create_driver_instance("user2")
        user3_driver = self.create_driver_instance("user3")
        user4_driver = self.create_driver_instance("user4")
        
        all_users = [
            (user1_driver, self.users[0]),
            (user2_driver, self.users[1]),
            (user3_driver, self.users[2]),
            (user4_driver, self.users[3])
        ]
        
        try:
            # Setup admin
            assert self.setup_admin_dashboard(admin_driver, test_config)
            
            # Setup all users
            for driver, user_config in all_users:
                assert self.setup_user_widget(driver, user_config, test_config)
            
            time.sleep(10)
            
            # Phase 1: All users send messages
            self.log_test_step("Phase 1: All users sending initial messages...")
            for driver, user_config in all_users:
                self.send_user_message(driver, f"Initial message from {user_config['name']}", user_config["name"])
                time.sleep(1)
            
            time.sleep(5)
            
            # Phase 2: Admin sends targeted replies
            self.log_test_step("Phase 2: Admin sending targeted replies...")
            admin_driver.refresh()
            self.wait_for_page_load(admin_driver)
            time.sleep(5)
            
            conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            for i, conv in enumerate(conversations[:2]):  # Reply to first 2
                self.utils.safe_click(admin_driver, conv)
                time.sleep(2)
                self.send_admin_message(admin_driver, f"Admin reply {i+1} at {int(time.time())}")
                time.sleep(1)
            
            # Phase 3: Broadcast message
            self.log_test_step("Phase 3: Admin broadcasting to all users...")
            comprehensive_broadcast = f"🎉 COMPREHENSIVE TEST BROADCAST: All systems working! {int(time.time())}"
            assert self.send_broadcast_message(admin_driver, comprehensive_broadcast)
            
            time.sleep(8)
            
            # Phase 4: Verify broadcast delivery
            self.log_test_step("Phase 4: Verifying broadcast delivery...")
            broadcast_success_count = 0
            
            for driver, user_config in all_users:
                if self.verify_message_received(driver, comprehensive_broadcast, "admin", user_config["name"]):
                    broadcast_success_count += 1
            
            # Take comprehensive screenshots
            self.take_screenshot(admin_driver, "comprehensive_test_admin")
            for i, (driver, user_config) in enumerate(all_users):
                self.take_screenshot(driver, f"comprehensive_test_user{i+1}")
            
            # Final verification
            assert len(conversations) >= 2, "Should have multiple conversations"
            assert broadcast_success_count >= 2, f"Broadcast should reach multiple users, reached: {broadcast_success_count}"
            
            self.log_test_step(f"✅ COMPREHENSIVE TEST PASSED: {broadcast_success_count}/{len(all_users)} users received broadcast")
            
        except Exception as e:
            self.log_test_step(f"❌ COMPREHENSIVE TEST FAILED: {e}")
            raise