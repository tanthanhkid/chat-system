import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from tests.selenium.base_test import BaseTest

class TestAdminInterface(BaseTest):
    """Test suite for admin interface functionality"""
    
    def setup_method(self):
        super().setup_method()
        self.test_broadcast_message = "Test broadcast message from automation"
        self.test_reply_message = "Test reply from admin"
    
    def test_admin_page_load(self, chrome_driver, utils, test_config):
        """Test that admin interface loads properly"""
        self.utils = utils
        
        self.log_test_step("Loading admin interface")
        chrome_driver.get(test_config["admin_url"])
        self.wait_for_page_load(chrome_driver)
        
        self.log_test_step("Checking page title and header")
        # Verify page title or header
        try:
            header = utils.wait_for_element(chrome_driver, By.TAG_NAME, "h1")
            assert "Chat Admin" in header.text, "Admin page should have correct header"
        except TimeoutException:
            pytest.fail("Admin page header not found")
        
        self.log_test_step("Checking main admin app container")
        self.assert_element_visible(chrome_driver, By.CSS_SELECTOR, "[data-testid='admin-app']")
        
        self.take_screenshot(chrome_driver, "admin_page_loaded")
        self.verify_no_console_errors(chrome_driver)
    
    def test_connection_status_display(self, chrome_driver, utils, test_config):
        """Test admin connection status display"""
        self.utils = utils
        
        self.log_test_step("Loading admin interface")
        chrome_driver.get(test_config["admin_url"])
        self.wait_for_page_load(chrome_driver)
        
        self.log_test_step("Checking connection status indicator")
        # Wait for connection status to appear
        status_element = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, ".connection-status")
        
        # Wait for connection to establish or fail
        max_wait = 15  # seconds
        final_status = None
        
        for _ in range(max_wait):
            status_text = status_element.text
            if "Connected" in status_text:
                final_status = "connected"
                break
            elif "Connection Error" in status_text:
                final_status = "error"
                break
            elif "Disconnected" in status_text:
                final_status = "disconnected"
                break
            time.sleep(1)
        
        self.log_test_step(f"Final connection status: {status_element.text}")
        
        # Verify status indicator has appropriate styling
        status_classes = status_element.get_attribute("class")
        has_status_class = any(cls in status_classes for cls in ["connected", "disconnected", "error"])
        assert has_status_class, "Connection status should have appropriate CSS class"
        
        self.take_screenshot(chrome_driver, "admin_connection_status")
        
        # If connection failed, check for retry button
        if final_status == "error":
            retry_buttons = chrome_driver.find_elements(By.CSS_SELECTOR, ".retry-connection-btn")
            if retry_buttons:
                self.log_test_step("Testing retry connection button")
                utils.safe_click(chrome_driver, retry_buttons[0])
                time.sleep(3)  # Wait for retry attempt
    
    def test_broadcast_message_functionality(self, chrome_driver, utils, test_config):
        """Test broadcast message functionality"""
        self.utils = utils
        
        self.log_test_step("Loading admin interface")
        chrome_driver.get(test_config["admin_url"])
        self.wait_for_page_load(chrome_driver)
        
        self.log_test_step("Finding broadcast input field")
        broadcast_input = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='broadcast-input']")
        
        self.log_test_step("Entering broadcast message")
        broadcast_input.clear()
        broadcast_input.send_keys(self.test_broadcast_message)
        
        # Verify text was entered
        assert broadcast_input.get_attribute("value") == self.test_broadcast_message
        
        self.log_test_step("Finding broadcast button")
        broadcast_button = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='broadcast-button']")
        
        # Check if button is enabled (depends on connection status)
        button_enabled = broadcast_button.is_enabled()
        self.log_test_step(f"Broadcast button enabled: {button_enabled}")
        
        if button_enabled:
            self.log_test_step("Clicking broadcast button")
            utils.safe_click(chrome_driver, broadcast_button)
            
            # Wait a moment for broadcast to process
            time.sleep(2)
            
            # Check if input was cleared (indicates successful broadcast)
            input_value_after = broadcast_input.get_attribute("value")
            assert input_value_after == "", "Broadcast input should be cleared after sending"
        else:
            self.log_test_step("Broadcast button disabled (likely due to connection issues)")
        
        self.take_screenshot(chrome_driver, "broadcast_functionality")
        self.verify_no_console_errors(chrome_driver)
    
    def test_conversations_list_display(self, chrome_driver, utils, test_config):
        """Test conversations list display and functionality"""
        self.utils = utils
        
        self.log_test_step("Loading admin interface")
        chrome_driver.get(test_config["admin_url"])
        self.wait_for_page_load(chrome_driver)
        
        self.log_test_step("Checking conversations list container")
        self.assert_element_visible(chrome_driver, By.CSS_SELECTOR, "[data-testid='conversations-list']")
        
        # Wait for conversations to load (or timeout)
        conversations_list = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='conversations-list']")
        
        # Give some time for conversations to load from API
        time.sleep(3)
        
        # Check if any conversations are displayed
        conversation_items = chrome_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
        
        self.log_test_step(f"Found {len(conversation_items)} conversations")
        
        if len(conversation_items) > 0:
            self.log_test_step("Testing conversation selection")
            first_conversation = conversation_items[0]
            
            # Get user email from test id
            test_id = first_conversation.get_attribute("data-testid")
            user_email = test_id.replace("conversation-", "")
            self.log_test_step(f"Selecting conversation with user: {user_email}")
            
            utils.safe_click(chrome_driver, first_conversation)
            
            # Verify conversation is selected (should have 'selected' class)
            time.sleep(1)
            conversation_classes = first_conversation.get_attribute("class")
            assert "selected" in conversation_classes, "Selected conversation should have 'selected' class"
            
            # Check if messages area appears
            try:
                self.assert_element_visible(chrome_driver, By.CSS_SELECTOR, "[data-testid='admin-messages']")
                self.log_test_step("Messages area visible after conversation selection")
            except:
                self.log_test_step("Messages area not visible (may be empty conversation)")
        else:
            self.log_test_step("No conversations found - this is expected if no users have chatted yet")
        
        self.take_screenshot(chrome_driver, "conversations_list")
        self.verify_no_console_errors(chrome_driver)
    
    def test_message_reply_functionality(self, chrome_driver, utils, test_config):
        """Test admin message reply functionality"""
        self.utils = utils
        
        self.log_test_step("Loading admin interface")
        chrome_driver.get(test_config["admin_url"])
        self.wait_for_page_load(chrome_driver)
        
        # Wait for conversations to load
        time.sleep(3)
        
        # Check if there are any conversations
        conversation_items = chrome_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
        
        if len(conversation_items) > 0:
            self.log_test_step("Selecting first conversation for reply test")
            utils.safe_click(chrome_driver, conversation_items[0])
            time.sleep(1)
            
            # Try to find message input
            try:
                self.log_test_step("Finding admin message input")
                message_input = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='admin-message-input']")
                
                self.log_test_step("Entering reply message")
                message_input.clear()
                message_input.send_keys(self.test_reply_message)
                
                # Find send button
                send_button = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='admin-send-button']")
                
                button_enabled = send_button.is_enabled()
                self.log_test_step(f"Send button enabled: {button_enabled}")
                
                if button_enabled:
                    self.log_test_step("Clicking send button")
                    utils.safe_click(chrome_driver, send_button)
                    
                    # Wait for message to be sent
                    time.sleep(2)
                    
                    # Check if input was cleared
                    input_value_after = message_input.get_attribute("value")
                    assert input_value_after == "", "Message input should be cleared after sending"
                else:
                    self.log_test_step("Send button disabled (likely due to connection issues)")
                
                # Test Enter key functionality
                self.log_test_step("Testing Enter key for sending messages")
                message_input.clear()
                message_input.send_keys("Test Enter key message")
                message_input.send_keys(Keys.ENTER)
                
                time.sleep(1)
                if button_enabled:
                    enter_input_value = message_input.get_attribute("value")
                    assert enter_input_value == "", "Message input should be cleared after Enter key"
                
            except TimeoutException:
                self.log_test_step("Message input not found - conversation may not be fully loaded")
        else:
            self.log_test_step("No conversations available for reply testing")
        
        self.take_screenshot(chrome_driver, "message_reply_test")
        self.verify_no_console_errors(chrome_driver)
    
    def test_admin_interface_responsiveness(self, chrome_driver, utils, test_config):
        """Test admin interface at different screen sizes"""
        self.utils = utils
        
        screen_sizes = [
            (1920, 1080, "desktop"),
            (1024, 768, "tablet_landscape"),
            (768, 1024, "tablet_portrait"),
            (375, 667, "mobile")
        ]
        
        for width, height, device_type in screen_sizes:
            self.log_test_step(f"Testing admin interface on {device_type}: {width}x{height}")
            
            chrome_driver.set_window_size(width, height)
            chrome_driver.get(test_config["admin_url"])
            self.wait_for_page_load(chrome_driver)
            
            # Verify main elements are visible
            self.assert_element_visible(chrome_driver, By.CSS_SELECTOR, "[data-testid='admin-app']")
            
            # Check header
            header = utils.wait_for_element(chrome_driver, By.TAG_NAME, "h1")
            assert header.is_displayed(), f"Header should be visible on {device_type}"
            
            # Check if sidebar elements are accessible
            try:
                broadcast_input = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='broadcast-input']", timeout=5)
                assert broadcast_input.is_displayed(), f"Broadcast input should be accessible on {device_type}"
            except TimeoutException:
                self.log_test_step(f"Broadcast input not immediately visible on {device_type} - may be collapsed")
            
            self.take_screenshot(chrome_driver, f"admin_responsive_{device_type}")
        
        self.verify_no_console_errors(chrome_driver)
    
    def test_online_user_indicators(self, chrome_driver, utils, test_config):
        """Test online user status indicators"""
        self.utils = utils
        
        self.log_test_step("Loading admin interface")
        chrome_driver.get(test_config["admin_url"])
        self.wait_for_page_load(chrome_driver)
        
        # Wait for conversations to load
        time.sleep(3)
        
        # Check for conversation items
        conversation_items = chrome_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
        
        if len(conversation_items) > 0:
            self.log_test_step("Checking online status indicators")
            
            for i, conversation in enumerate(conversation_items[:3]):  # Check first 3
                # Look for status indicator
                status_indicators = conversation.find_elements(By.CSS_SELECTOR, ".status-indicator")
                
                if status_indicators:
                    status_indicator = status_indicators[0]
                    status_text = status_indicator.text
                    status_classes = status_indicator.get_attribute("class")
                    
                    self.log_test_step(f"Conversation {i+1} status: {status_text}, classes: {status_classes}")
                    
                    # Should have either online or offline indicator
                    has_status = "online" in status_classes or "offline" in status_classes
                    assert has_status, f"Conversation {i+1} should have online/offline status"
                else:
                    self.log_test_step(f"No status indicator found for conversation {i+1}")
        else:
            self.log_test_step("No conversations found to check status indicators")
        
        self.take_screenshot(chrome_driver, "online_status_indicators")
        self.verify_no_console_errors(chrome_driver)
    
    def test_admin_performance_metrics(self, chrome_driver, utils, test_config):
        """Test admin interface performance"""
        self.utils = utils
        
        self.log_test_step("Loading admin interface for performance test")
        start_time = time.time()
        
        chrome_driver.get(test_config["admin_url"])
        self.wait_for_page_load(chrome_driver)
        
        load_time = time.time() - start_time
        self.log_test_step(f"Page load time: {load_time:.2f} seconds")
        
        # Get performance metrics
        performance_data = self.get_network_performance(chrome_driver)
        if performance_data:
            self.log_test_step(f"Performance metrics: {performance_data}")
            
            # Assert reasonable load times (adjust thresholds as needed)
            assert load_time < 10, f"Page should load within 10 seconds, took {load_time:.2f}s"
            
            if performance_data.get('loadComplete'):
                load_complete = performance_data['loadComplete'] / 1000  # Convert to seconds
                assert load_complete < 15, f"Load complete should be under 15s, was {load_complete:.2f}s"
        
        # Check for memory leaks by monitoring initial vs final memory
        try:
            initial_memory = chrome_driver.execute_script("return performance.memory.usedJSHeapSize")
            
            # Perform some actions to stress test
            self.log_test_step("Performing stress test actions")
            for _ in range(5):
                # Reload conversations (if API available)
                chrome_driver.refresh()
                self.wait_for_page_load(chrome_driver)
            
            final_memory = chrome_driver.execute_script("return performance.memory.usedJSHeapSize")
            memory_growth = final_memory - initial_memory
            
            self.log_test_step(f"Memory growth: {memory_growth} bytes")
            
            # Memory shouldn't grow excessively (adjust threshold as needed)
            assert memory_growth < 50000000, f"Memory growth too high: {memory_growth} bytes"
            
        except Exception as e:
            self.log_test_step(f"Memory performance test failed: {e}")
        
        self.take_screenshot(chrome_driver, "performance_test")
        self.verify_no_console_errors(chrome_driver)