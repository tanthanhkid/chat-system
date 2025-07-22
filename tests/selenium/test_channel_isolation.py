import pytest
import time
import threading
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from tests.selenium.base_test import BaseTest
import uuid
import os
from datetime import datetime

class TestChannelIsolation(BaseTest):
    """
    Comprehensive channel isolation tests to ensure each user has completely 
    separate chat channels with proper message isolation and conversation mapping.
    """
    
    def setup_method(self):
        super().setup_method()
        self.test_session_id = str(uuid.uuid4())[:8]
        self.drivers = []  # Track all drivers for cleanup
        
        # Test users with unique identifiers
        self.test_users = [
            {
                "email": f"user.a.{self.test_session_id}@example.com",
                "name": "User A",
                "unique_id": "USER_A"
            },
            {
                "email": f"user.b.{self.test_session_id}@example.com", 
                "name": "User B",
                "unique_id": "USER_B"
            },
            {
                "email": f"user.c.{self.test_session_id}@example.com",
                "name": "User C", 
                "unique_id": "USER_C"
            },
            {
                "email": f"user.d.{self.test_session_id}@example.com",
                "name": "User D",
                "unique_id": "USER_D"
            }
        ]
        
        # Message templates for isolation testing
        self.message_templates = {
            "USER_A": "ISOLATION_TEST_USER_A_MSG_{timestamp}_{session}",
            "USER_B": "ISOLATION_TEST_USER_B_MSG_{timestamp}_{session}",
            "USER_C": "ISOLATION_TEST_USER_C_MSG_{timestamp}_{session}",
            "USER_D": "ISOLATION_TEST_USER_D_MSG_{timestamp}_{session}",
            "ADMIN_TO_A": "ADMIN_REPLY_TO_USER_A_{timestamp}_{session}",
            "ADMIN_TO_B": "ADMIN_REPLY_TO_USER_B_{timestamp}_{session}",
            "ADMIN_TO_C": "ADMIN_REPLY_TO_USER_C_{timestamp}_{session}"
        }
        
        self.test_results = {
            "messages_sent": [],
            "messages_received": {},
            "conversation_mappings": {},
            "isolation_violations": [],
            "timing_data": {}
        }
    
    def teardown_method(self):
        """Clean up all drivers and log test results"""
        self.log_test_step(f"=== TEST SESSION {self.test_session_id} CLEANUP ===")
        
        # Log test results summary
        if self.test_results["isolation_violations"]:
            self.log_test_step("⚠️ ISOLATION VIOLATIONS DETECTED:")
            for violation in self.test_results["isolation_violations"]:
                self.log_test_step(f"  - {violation}")
        else:
            self.log_test_step("✅ NO ISOLATION VIOLATIONS DETECTED")
        
        # Cleanup drivers
        for driver in self.drivers:
            try:
                driver.quit()
            except:
                pass
        self.drivers.clear()
        super().teardown_method()
    
    def create_driver_instance(self, name="driver"):
        """Create a new WebDriver instance with optimized settings"""
        try:
            chrome_options = Options()
            chrome_options.add_argument("--headless=new")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("--disable-web-security")
            chrome_options.add_argument("--allow-running-insecure-content")
            chrome_options.add_argument("--disable-logging")
            chrome_options.add_argument("--silent")
            
            # Prioritize system ChromeDriver
            system_chromedriver = "/opt/homebrew/bin/chromedriver"
            if os.path.exists(system_chromedriver):
                service = Service(system_chromedriver)
            else:
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
            driver.implicitly_wait(3)
            self.drivers.append(driver)
            
            self.log_test_step(f"Created {name} driver instance")
            return driver
            
        except Exception as e:
            self.log_test_step(f"Failed to create {name} driver: {e}")
            raise
    
    def setup_user_widget(self, driver, user_config, test_config, wait_time=2):
        """Setup user chat widget with specific user email"""
        try:
            driver.get(test_config["widget_test_url"])
            self.wait_for_page_load(driver)
            
            # Switch to the specific user
            driver.execute_script(f"""
                currentEmail = '{user_config["email"]}';
                document.getElementById('current-user').textContent = currentEmail;
                renderWidget();
            """)
            
            time.sleep(wait_time)
            
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
            time.sleep(3)
            
            self.log_test_step("Setup admin dashboard")
            return True
            
        except Exception as e:
            self.log_test_step(f"Failed to setup admin dashboard: {e}")
            return False
    
    def send_user_message(self, driver, user_config, message_content, wait_for_connection=True):
        """Send message from user with connection waiting and verification"""
        try:
            start_time = time.time()
            
            message_input = driver.find_element(By.CSS_SELECTOR, "[data-testid='message-input']")
            send_button = driver.find_element(By.CSS_SELECTOR, "[data-testid='send-button']")
            
            # First, enter the message text
            message_input.clear()
            message_input.send_keys(message_content)
            
            # Wait for connection if required
            if wait_for_connection:
                max_wait = 15
                for i in range(max_wait):
                    if send_button.is_enabled():
                        break
                    # Check console logs for debugging
                    if i == 5:  # Check logs after 5 seconds
                        try:
                            console_logs = driver.get_log('browser')
                            for log in console_logs:
                                if 'Socket connected' in log['message'] or 'conversation-joined' in log['message']:
                                    self.log_test_step(f"Browser log: {log['message']}")
                        except Exception as e:
                            self.log_test_step(f"Could not get browser logs: {e}")
                    time.sleep(1)
                else:
                    # Get final debugging info
                    try:
                        button_title = send_button.get_attribute('title')
                        self.log_test_step(f"❌ {user_config['name']} send button never enabled. Button state: {button_title}")
                    except:
                        self.log_test_step(f"❌ {user_config['name']} send button never enabled")
                    return False
            
            if send_button.is_enabled():
                self.utils.safe_click(driver, send_button)
                
                # Record message sent
                send_time = time.time()
                self.test_results["messages_sent"].append({
                    "user": user_config["unique_id"],
                    "email": user_config["email"],
                    "message": message_content,
                    "timestamp": send_time,
                    "send_duration": send_time - start_time
                })
                
                self.log_test_step(f"✅ {user_config['name']} sent: {message_content}")
                return True
            else:
                self.log_test_step(f"❌ {user_config['name']} send button not enabled")
                return False
                
        except Exception as e:
            self.log_test_step(f"❌ Failed to send message from {user_config['name']}: {e}")
            return False
    
    def verify_user_messages(self, driver, user_config, expected_messages, should_not_see_messages=None):
        """Verify which messages a user can see in their chat"""
        try:
            # Get all messages visible to this user
            user_messages = driver.find_elements(By.CSS_SELECTOR, "[data-testid='message-user']")
            admin_messages = driver.find_elements(By.CSS_SELECTOR, "[data-testid='message-admin']")
            
            visible_messages = []
            for msg in user_messages + admin_messages:
                visible_messages.append(msg.text.strip())
            
            # Store results
            self.test_results["messages_received"][user_config["unique_id"]] = visible_messages
            
            # Check expected messages
            missing_messages = []
            for expected_msg in expected_messages:
                if not any(expected_msg in visible_msg for visible_msg in visible_messages):
                    missing_messages.append(expected_msg)
            
            # Check for messages that should NOT be visible (isolation check)
            isolation_violations = []
            if should_not_see_messages:
                for forbidden_msg in should_not_see_messages:
                    if any(forbidden_msg in visible_msg for visible_msg in visible_messages):
                        isolation_violations.append(forbidden_msg)
                        self.test_results["isolation_violations"].append(
                            f"{user_config['name']} can see forbidden message: {forbidden_msg}"
                        )
            
            # Log results
            if missing_messages:
                self.log_test_step(f"❌ {user_config['name']} missing messages: {missing_messages}")
            if isolation_violations:
                self.log_test_step(f"🚨 {user_config['name']} ISOLATION VIOLATION - can see: {isolation_violations}")
            if not missing_messages and not isolation_violations:
                self.log_test_step(f"✅ {user_config['name']} message isolation verified")
                
            return len(missing_messages) == 0 and len(isolation_violations) == 0
            
        except Exception as e:
            self.log_test_step(f"❌ Error verifying messages for {user_config['name']}: {e}")
            return False
    
    def verify_admin_conversation_mapping(self, admin_driver, expected_mappings):
        """Verify admin interface shows correct email-to-conversation mapping"""
        try:
            conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            
            found_mappings = {}
            for conv in conversations:
                conv_text = conv.text.lower()
                for email, user_info in expected_mappings.items():
                    if email.lower() in conv_text:
                        found_mappings[email] = user_info
                        break
            
            self.test_results["conversation_mappings"] = found_mappings
            
            missing_mappings = []
            for email, user_info in expected_mappings.items():
                if email not in found_mappings:
                    missing_mappings.append(f"{user_info['name']} ({email})")
            
            if missing_mappings:
                self.log_test_step(f"❌ Admin missing conversation mappings: {missing_mappings}")
                return False
            else:
                self.log_test_step(f"✅ Admin conversation mappings verified: {len(found_mappings)} found")
                return True
                
        except Exception as e:
            self.log_test_step(f"❌ Error verifying admin conversation mapping: {e}")
            return False
    
    def select_admin_conversation(self, admin_driver, target_email):
        """Select specific conversation in admin interface by user email"""
        try:
            conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            
            for conv in conversations:
                if target_email.lower() in conv.text.lower():
                    self.utils.safe_click(admin_driver, conv)
                    time.sleep(2)  # Wait for conversation to load
                    self.log_test_step(f"✅ Admin selected conversation for {target_email}")
                    return True
            
            self.log_test_step(f"❌ Admin could not find conversation for {target_email}")
            return False
            
        except Exception as e:
            self.log_test_step(f"❌ Error selecting admin conversation for {target_email}: {e}")
            return False
    
    def send_admin_message(self, admin_driver, message_content):
        """Send message from admin to currently selected conversation"""
        try:
            admin_input = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='admin-message-input']")
            admin_send = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='admin-send-button']")
            
            if admin_send.is_enabled():
                admin_input.clear()
                admin_input.send_keys(message_content)
                self.utils.safe_click(admin_driver, admin_send)
                
                self.log_test_step(f"✅ Admin sent: {message_content}")
                return True
            else:
                self.log_test_step("❌ Admin send button not enabled")
                return False
                
        except Exception as e:
            self.log_test_step(f"❌ Error sending admin message: {e}")
            return False
    
    def get_message_content(self, template_key, timestamp=None):
        """Generate unique message content for testing"""
        if timestamp is None:
            timestamp = str(int(time.time()))
        
        return self.message_templates[template_key].format(
            timestamp=timestamp,
            session=self.test_session_id
        )
    
    # ========== TEST IMPLEMENTATIONS ==========
    
    def test_basic_two_user_channel_isolation(self, chrome_driver, utils, test_config):
        """
        Test 1: Basic Two-User Channel Isolation
        Verify that User A and User B have completely separate channels
        """
        self.utils = utils
        self.log_test_step("=== TEST 1: Basic Two-User Channel Isolation ===")
        
        # Create drivers
        admin_driver = self.create_driver_instance("admin")
        user_b_driver = self.create_driver_instance("user_b")
        
        try:
            # Setup admin
            assert self.setup_admin_dashboard(admin_driver, test_config), "Admin setup failed"
            
            # Setup User A (using fixture driver) and User B
            user_a = self.test_users[0]  # User A
            user_b = self.test_users[1]  # User B
            
            assert self.setup_user_widget(chrome_driver, user_a, test_config), "User A setup failed"
            assert self.setup_user_widget(user_b_driver, user_b, test_config), "User B setup failed"
            
            # Wait for all connections
            time.sleep(5)
            
            # Generate unique messages
            msg_a = self.get_message_content("USER_A")
            msg_b = self.get_message_content("USER_B")
            
            # Users send their unique messages
            assert self.send_user_message(chrome_driver, user_a, msg_a), "User A message send failed"
            assert self.send_user_message(user_b_driver, user_b, msg_b), "User B message send failed"
            
            # Wait for message processing
            time.sleep(3)
            
            # Verify isolation: User A should only see their message, not User B's
            user_a_isolation = self.verify_user_messages(
                chrome_driver, user_a, 
                expected_messages=[msg_a],
                should_not_see_messages=[msg_b]
            )
            
            # Verify isolation: User B should only see their message, not User A's  
            user_b_isolation = self.verify_user_messages(
                user_b_driver, user_b,
                expected_messages=[msg_b], 
                should_not_see_messages=[msg_a]
            )
            
            # Admin should see both conversations separately
            admin_driver.refresh()
            time.sleep(5)  # Allow time for new conversations to appear
            
            admin_mapping = self.verify_admin_conversation_mapping(admin_driver, {
                user_a["email"]: user_a,
                user_b["email"]: user_b
            })
            
            # Take screenshots
            self.take_screenshot(chrome_driver, "test1_user_a_isolation")
            user_b_driver.save_screenshot("test-results/screenshots/test1_user_b_isolation.png")
            admin_driver.save_screenshot("test-results/screenshots/test1_admin_conversations.png")
            
            # Assert all isolation checks passed
            assert user_a_isolation, "User A isolation failed - can see User B's messages"
            assert user_b_isolation, "User B isolation failed - can see User A's messages" 
            assert admin_mapping, "Admin conversation mapping failed"
            
            self.log_test_step("✅ TEST 1 PASSED: Basic two-user channel isolation verified")
            
        except Exception as e:
            self.log_test_step(f"❌ TEST 1 FAILED: {e}")
            raise
            
        finally:
            user_b_driver.quit()
            admin_driver.quit()
    
    def test_admin_conversation_switching_accuracy(self, chrome_driver, utils, test_config):
        """
        Test 2: Admin Conversation Switching Accuracy
        Test that admin sees correct messages when switching between conversations
        """
        self.utils = utils
        self.log_test_step("=== TEST 2: Admin Conversation Switching Accuracy ===")
        
        # Create drivers for admin and multiple users
        admin_driver = self.create_driver_instance("admin")
        user_b_driver = self.create_driver_instance("user_b")
        user_c_driver = self.create_driver_instance("user_c")
        
        try:
            # Setup all drivers
            assert self.setup_admin_dashboard(admin_driver, test_config), "Admin setup failed"
            
            user_a = self.test_users[0]
            user_b = self.test_users[1] 
            user_c = self.test_users[2]
            
            assert self.setup_user_widget(chrome_driver, user_a, test_config), "User A setup failed"
            assert self.setup_user_widget(user_b_driver, user_b, test_config), "User B setup failed"
            assert self.setup_user_widget(user_c_driver, user_c, test_config), "User C setup failed"
            
            # Wait for connections
            time.sleep(8)
            
            # Each user sends unique identifiable messages
            msg_a = self.get_message_content("USER_A")
            msg_b = self.get_message_content("USER_B")  
            msg_c = self.get_message_content("USER_C")
            
            assert self.send_user_message(chrome_driver, user_a, msg_a), "User A message failed"
            assert self.send_user_message(user_b_driver, user_b, msg_b), "User B message failed"
            assert self.send_user_message(user_c_driver, user_c, msg_c), "User C message failed"
            
            time.sleep(5)
            
            # Admin refreshes to see all conversations
            admin_driver.refresh()
            self.wait_for_page_load(admin_driver)
            time.sleep(5)
            
            # Test conversation switching accuracy
            switching_results = []
            
            # Admin selects User A's conversation
            if self.select_admin_conversation(admin_driver, user_a["email"]):
                # Verify only User A's messages are visible
                admin_messages_a = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid='admin-message-user']")
                visible_content_a = [msg.text for msg in admin_messages_a]
                
                has_msg_a = any(msg_a in content for content in visible_content_a)
                has_msg_b = any(msg_b in content for content in visible_content_a)
                has_msg_c = any(msg_c in content for content in visible_content_a)
                
                switching_results.append({
                    "conversation": "User A",
                    "should_see": msg_a,
                    "should_not_see": [msg_b, msg_c],
                    "correct": has_msg_a and not has_msg_b and not has_msg_c
                })
                
                self.log_test_step(f"Admin viewing User A: sees A={has_msg_a}, sees B={has_msg_b}, sees C={has_msg_c}")
            
            time.sleep(2)
            
            # Admin selects User B's conversation
            if self.select_admin_conversation(admin_driver, user_b["email"]):
                admin_messages_b = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid='admin-message-user']")
                visible_content_b = [msg.text for msg in admin_messages_b]
                
                has_msg_a = any(msg_a in content for content in visible_content_b)
                has_msg_b = any(msg_b in content for content in visible_content_b)
                has_msg_c = any(msg_c in content for content in visible_content_b)
                
                switching_results.append({
                    "conversation": "User B", 
                    "should_see": msg_b,
                    "should_not_see": [msg_a, msg_c],
                    "correct": has_msg_b and not has_msg_a and not has_msg_c
                })
                
                self.log_test_step(f"Admin viewing User B: sees A={has_msg_a}, sees B={has_msg_b}, sees C={has_msg_c}")
            
            time.sleep(2)
            
            # Admin selects User C's conversation
            if self.select_admin_conversation(admin_driver, user_c["email"]):
                admin_messages_c = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid='admin-message-user']")
                visible_content_c = [msg.text for msg in admin_messages_c]
                
                has_msg_a = any(msg_a in content for content in visible_content_c)
                has_msg_b = any(msg_b in content for content in visible_content_c)
                has_msg_c = any(msg_c in content for content in visible_content_c)
                
                switching_results.append({
                    "conversation": "User C",
                    "should_see": msg_c, 
                    "should_not_see": [msg_a, msg_b],
                    "correct": has_msg_c and not has_msg_a and not has_msg_b
                })
                
                self.log_test_step(f"Admin viewing User C: sees A={has_msg_a}, sees B={has_msg_b}, sees C={has_msg_c}")
            
            # Take screenshots of final state
            self.take_screenshot(chrome_driver, "test2_user_a_final") 
            user_b_driver.save_screenshot("test-results/screenshots/test2_user_b_final.png")
            user_c_driver.save_screenshot("test-results/screenshots/test2_user_c_final.png")
            admin_driver.save_screenshot("test-results/screenshots/test2_admin_switching.png")
            
            # Verify all switching was accurate
            all_correct = all(result["correct"] for result in switching_results)
            incorrect_switches = [r for r in switching_results if not r["correct"]]
            
            if incorrect_switches:
                self.log_test_step(f"❌ Incorrect conversation switches: {incorrect_switches}")
                for violation in incorrect_switches:
                    self.test_results["isolation_violations"].append(
                        f"Admin conversation switching: {violation['conversation']} showed wrong messages"
                    )
            
            assert all_correct, f"Admin conversation switching failed: {incorrect_switches}"
            
            self.log_test_step("✅ TEST 2 PASSED: Admin conversation switching accuracy verified")
            
        except Exception as e:
            self.log_test_step(f"❌ TEST 2 FAILED: {e}")
            raise
            
        finally:
            user_b_driver.quit()
            user_c_driver.quit()
            admin_driver.quit()
    
    def test_realtime_message_isolation(self, chrome_driver, utils, test_config):
        """
        Test 3: Real-Time Message Isolation
        Test real-time updates maintain channel isolation
        """
        self.utils = utils
        self.log_test_step("=== TEST 3: Real-Time Message Isolation ===")
        
        admin_driver = self.create_driver_instance("admin")
        user_b_driver = self.create_driver_instance("user_b")
        
        try:
            # Setup
            assert self.setup_admin_dashboard(admin_driver, test_config), "Admin setup failed"
            
            user_a = self.test_users[0]
            user_b = self.test_users[1]
            
            assert self.setup_user_widget(chrome_driver, user_a, test_config), "User A setup failed"
            assert self.setup_user_widget(user_b_driver, user_b, test_config), "User B setup failed"
            
            time.sleep(8)
            
            # Users send initial messages to establish conversations
            initial_msg_a = self.get_message_content("USER_A", "INITIAL")
            initial_msg_b = self.get_message_content("USER_B", "INITIAL")
            
            assert self.send_user_message(chrome_driver, user_a, initial_msg_a)
            assert self.send_user_message(user_b_driver, user_b, initial_msg_b)
            
            time.sleep(5)
            
            # Admin views User A's conversation
            admin_driver.refresh()
            time.sleep(5)  # Allow more time for admin interface to update
            assert self.select_admin_conversation(admin_driver, user_a["email"]), "Admin failed to select User A"
            
            # While admin is viewing User A, User B sends a new message
            realtime_msg_b = self.get_message_content("USER_B", "REALTIME")
            assert self.send_user_message(user_b_driver, user_b, realtime_msg_b), "User B realtime message failed"
            
            time.sleep(3)
            
            # CRITICAL TEST: Verify User B's new message does NOT appear in User A's conversation (admin's current view)
            admin_messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='admin-message-']")
            current_visible_content = ' '.join([msg.text for msg in admin_messages])
            
            # Check if User B's realtime message leaked into User A's conversation - THIS IS THE BUG WE'RE FIXING
            realtime_isolation_violated = realtime_msg_b in current_visible_content
            
            self.log_test_step(f"🔍 Admin viewing User A conversation, checking for User B message leak...")
            self.log_test_step(f"   User A initial message: {initial_msg_a[:20]}...")
            self.log_test_step(f"   User B realtime message: {realtime_msg_b[:20]}...")
            self.log_test_step(f"   Admin chat content: {current_visible_content[:100]}...")
            
            if realtime_isolation_violated:
                self.log_test_step("❌ ISOLATION VIOLATION: User B's message appeared in User A's chat!")
            else:
                self.log_test_step("✅ ISOLATION MAINTAINED: User B's message correctly isolated")
            
            # Verify sidebar shows User B's new message (without affecting main chat)
            self.log_test_step("🔍 Checking if sidebar correctly shows User B's new message...")
            time.sleep(2)  # Allow sidebar to update
            
            sidebar_conversations = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            user_b_sidebar_updated = False
            
            for conv in sidebar_conversations:
                if user_b["email"] in conv.text.lower():
                    # Check if User B's conversation shows the new message preview
                    user_b_sidebar_updated = realtime_msg_b[:20] in conv.text
                    break
            
            self.log_test_step(f"   Sidebar update for User B: {'✅ Updated' if user_b_sidebar_updated else '❌ Not updated'}")
            
            if realtime_isolation_violated:
                self.test_results["isolation_violations"].append(
                    f"Real-time message leak: User B's message appeared in User A's conversation"
                )
                self.log_test_step("🚨 REAL-TIME ISOLATION VIOLATION: User B message appeared in User A conversation")
            else:
                self.log_test_step("✅ Real-time isolation maintained: User B message not visible in User A conversation")
            
            # Now admin switches to User B's conversation
            assert self.select_admin_conversation(admin_driver, user_b["email"]), "Admin failed to select User B"
            
            # Verify User B's realtime message is now visible
            user_b_messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid='admin-message-user']")
            user_b_content = [msg.text for msg in user_b_messages]
            
            realtime_msg_visible = any(realtime_msg_b in content for content in user_b_content)
            
            # Take screenshots
            self.take_screenshot(chrome_driver, "test3_user_a_realtime")
            user_b_driver.save_screenshot("test-results/screenshots/test3_user_b_realtime.png")
            admin_driver.save_screenshot("test-results/screenshots/test3_admin_realtime.png")
            
            # Assertions
            assert not realtime_isolation_violated, "Real-time message isolation violated"
            assert realtime_msg_visible, "User B's realtime message not visible in their own conversation"
            
            self.log_test_step("✅ TEST 3 PASSED: Real-time message isolation verified")
            
        except Exception as e:
            self.log_test_step(f"❌ TEST 3 FAILED: {e}")
            raise
            
        finally:
            user_b_driver.quit()
            admin_driver.quit()
    
    def test_concurrent_message_isolation(self, chrome_driver, utils, test_config):
        """
        Test 4: Concurrent Message Sending
        Test channel isolation under concurrent load
        """
        self.utils = utils
        self.log_test_step("=== TEST 4: Concurrent Message Isolation ===")
        
        admin_driver = self.create_driver_instance("admin")
        user_b_driver = self.create_driver_instance("user_b")
        user_c_driver = self.create_driver_instance("user_c")
        
        try:
            # Setup
            assert self.setup_admin_dashboard(admin_driver, test_config), "Admin setup failed"
            
            user_a = self.test_users[0]
            user_b = self.test_users[1] 
            user_c = self.test_users[2]
            
            assert self.setup_user_widget(chrome_driver, user_a, test_config), "User A setup failed"
            assert self.setup_user_widget(user_b_driver, user_b, test_config), "User B setup failed"
            assert self.setup_user_widget(user_c_driver, user_c, test_config), "User C setup failed"
            
            time.sleep(10)
            
            # Prepare concurrent messages
            concurrent_messages = {
                "USER_A": self.get_message_content("USER_A", "CONCURRENT"),
                "USER_B": self.get_message_content("USER_B", "CONCURRENT"),
                "USER_C": self.get_message_content("USER_C", "CONCURRENT")
            }
            
            # Send messages concurrently using threading
            def send_concurrent_message(driver, user, message):
                time.sleep(0.5)  # Slight stagger
                return self.send_user_message(driver, user, message, wait_for_connection=False)
            
            # Create and start threads
            threads = [
                threading.Thread(target=send_concurrent_message, args=(chrome_driver, user_a, concurrent_messages["USER_A"])),
                threading.Thread(target=send_concurrent_message, args=(user_b_driver, user_b, concurrent_messages["USER_B"])),
                threading.Thread(target=send_concurrent_message, args=(user_c_driver, user_c, concurrent_messages["USER_C"]))
            ]
            
            self.log_test_step("Sending concurrent messages from all users...")
            
            # Start all threads simultaneously
            start_time = time.time()
            for thread in threads:
                thread.start()
            
            # Wait for all to complete
            for thread in threads:
                thread.join()
            
            concurrent_duration = time.time() - start_time
            self.test_results["timing_data"]["concurrent_send_duration"] = concurrent_duration
            
            self.log_test_step(f"Concurrent messages completed in {concurrent_duration:.2f} seconds")
            
            # Wait for message processing
            time.sleep(5)
            
            # Verify each user only sees their own concurrent message
            isolation_results = []
            
            # Check User A
            user_a_isolation = self.verify_user_messages(
                chrome_driver, user_a,
                expected_messages=[concurrent_messages["USER_A"]],
                should_not_see_messages=[concurrent_messages["USER_B"], concurrent_messages["USER_C"]]
            )
            isolation_results.append(("User A", user_a_isolation))
            
            # Check User B  
            user_b_isolation = self.verify_user_messages(
                user_b_driver, user_b,
                expected_messages=[concurrent_messages["USER_B"]],
                should_not_see_messages=[concurrent_messages["USER_A"], concurrent_messages["USER_C"]]
            )
            isolation_results.append(("User B", user_b_isolation))
            
            # Check User C
            user_c_isolation = self.verify_user_messages(
                user_c_driver, user_c,
                expected_messages=[concurrent_messages["USER_C"]],
                should_not_see_messages=[concurrent_messages["USER_A"], concurrent_messages["USER_B"]]
            )
            isolation_results.append(("User C", user_c_isolation))
            
            # Take screenshots
            self.take_screenshot(chrome_driver, "test4_concurrent_user_a")
            user_b_driver.save_screenshot("test-results/screenshots/test4_concurrent_user_b.png")
            user_c_driver.save_screenshot("test-results/screenshots/test4_concurrent_user_c.png")
            admin_driver.save_screenshot("test-results/screenshots/test4_concurrent_admin.png")
            
            # Assert all isolations passed
            all_isolated = all(result[1] for result in isolation_results)
            failed_isolations = [name for name, result in isolation_results if not result]
            
            if failed_isolations:
                self.log_test_step(f"❌ Concurrent isolation failures: {failed_isolations}")
            
            assert all_isolated, f"Concurrent message isolation failed for: {failed_isolations}"
            
            self.log_test_step("✅ TEST 4 PASSED: Concurrent message isolation verified")
            
        except Exception as e:
            self.log_test_step(f"❌ TEST 4 FAILED: {e}")
            raise
            
        finally:
            user_b_driver.quit()
            user_c_driver.quit()
            admin_driver.quit()
    
    def test_admin_targeted_replies(self, chrome_driver, utils, test_config):
        """
        Test 5: Admin-to-User Message Targeting
        Test admin messages reach only intended user
        """
        self.utils = utils
        self.log_test_step("=== TEST 5: Admin-to-User Message Targeting ===")
        
        admin_driver = self.create_driver_instance("admin")
        user_b_driver = self.create_driver_instance("user_b")
        user_c_driver = self.create_driver_instance("user_c")
        
        try:
            # Setup
            assert self.setup_admin_dashboard(admin_driver, test_config), "Admin setup failed"
            
            user_a = self.test_users[0]
            user_b = self.test_users[1]
            user_c = self.test_users[2]
            
            assert self.setup_user_widget(chrome_driver, user_a, test_config), "User A setup failed"
            assert self.setup_user_widget(user_b_driver, user_b, test_config), "User B setup failed"
            assert self.setup_user_widget(user_c_driver, user_c, test_config), "User C setup failed"
            
            time.sleep(10)
            
            # Users send initial messages to establish conversations
            initial_messages = {
                "USER_A": self.get_message_content("USER_A", "ESTABLISH"),
                "USER_B": self.get_message_content("USER_B", "ESTABLISH"),
                "USER_C": self.get_message_content("USER_C", "ESTABLISH")
            }
            
            assert self.send_user_message(chrome_driver, user_a, initial_messages["USER_A"])
            assert self.send_user_message(user_b_driver, user_b, initial_messages["USER_B"])
            assert self.send_user_message(user_c_driver, user_c, initial_messages["USER_C"])
            
            time.sleep(5)
            
            # Admin refreshes and sends targeted replies
            admin_driver.refresh()
            time.sleep(5)
            
            # Prepare targeted admin replies
            admin_replies = {
                "TO_A": self.get_message_content("ADMIN_TO_A"),
                "TO_B": self.get_message_content("ADMIN_TO_B"),
                "TO_C": self.get_message_content("ADMIN_TO_C")
            }
            
            # Admin replies to User A
            assert self.select_admin_conversation(admin_driver, user_a["email"]), "Failed to select User A"
            assert self.send_admin_message(admin_driver, admin_replies["TO_A"]), "Failed to send admin reply to A"
            
            time.sleep(2)
            
            # Admin replies to User B
            assert self.select_admin_conversation(admin_driver, user_b["email"]), "Failed to select User B" 
            assert self.send_admin_message(admin_driver, admin_replies["TO_B"]), "Failed to send admin reply to B"
            
            time.sleep(2)
            
            # Admin replies to User C
            assert self.select_admin_conversation(admin_driver, user_c["email"]), "Failed to select User C"
            assert self.send_admin_message(admin_driver, admin_replies["TO_C"]), "Failed to send admin reply to C"
            
            time.sleep(5)
            
            # Verify targeting: each user should only see their targeted reply
            targeting_results = []
            
            # User A should only see admin reply TO_A
            user_a_targeting = self.verify_user_messages(
                chrome_driver, user_a,
                expected_messages=[admin_replies["TO_A"]],
                should_not_see_messages=[admin_replies["TO_B"], admin_replies["TO_C"]]
            )
            targeting_results.append(("User A", user_a_targeting))
            
            # User B should only see admin reply TO_B
            user_b_targeting = self.verify_user_messages(
                user_b_driver, user_b,
                expected_messages=[admin_replies["TO_B"]],
                should_not_see_messages=[admin_replies["TO_A"], admin_replies["TO_C"]]
            )
            targeting_results.append(("User B", user_b_targeting))
            
            # User C should only see admin reply TO_C
            user_c_targeting = self.verify_user_messages(
                user_c_driver, user_c,
                expected_messages=[admin_replies["TO_C"]],
                should_not_see_messages=[admin_replies["TO_A"], admin_replies["TO_B"]]
            )
            targeting_results.append(("User C", user_c_targeting))
            
            # Take screenshots
            self.take_screenshot(chrome_driver, "test5_targeting_user_a")
            user_b_driver.save_screenshot("test-results/screenshots/test5_targeting_user_b.png")
            user_c_driver.save_screenshot("test-results/screenshots/test5_targeting_user_c.png")
            admin_driver.save_screenshot("test-results/screenshots/test5_targeting_admin.png")
            
            # Assert all targeting was accurate
            all_targeted = all(result[1] for result in targeting_results)
            failed_targeting = [name for name, result in targeting_results if not result]
            
            if failed_targeting:
                self.log_test_step(f"❌ Admin message targeting failures: {failed_targeting}")
            
            assert all_targeted, f"Admin message targeting failed for: {failed_targeting}"
            
            self.log_test_step("✅ TEST 5 PASSED: Admin-to-user message targeting verified")
            
        except Exception as e:
            self.log_test_step(f"❌ TEST 5 FAILED: {e}")
            raise
            
        finally:
            user_b_driver.quit()
            user_c_driver.quit() 
            admin_driver.quit()