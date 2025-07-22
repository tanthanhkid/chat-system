import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException
from tests.selenium.base_test import BaseTest

class TestChatWidget(BaseTest):
    """Test suite for chat widget functionality"""
    
    def setup_method(self):
        super().setup_method()
        self.test_email = "test@example.com"
        self.test_message = "Hello from automated test!"
    
    def test_widget_button_visibility(self, chrome_driver, utils, test_config):
        """Test that chat widget button is visible on page load"""
        self.utils = utils
        self.wait = utils.wait_for_element
        
        self.log_test_step("Loading test page")
        chrome_driver.get(test_config["widget_test_url"])
        
        self.log_test_step("Waiting for page to load")
        self.wait_for_page_load(chrome_driver)
        
        self.log_test_step("Checking chat toggle button visibility")
        self.assert_element_visible(chrome_driver, By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
        
        # Take screenshot for verification
        self.take_screenshot(chrome_driver, "widget_button_visible")
        
        # Verify no JS errors
        self.verify_no_console_errors(chrome_driver)
    
    def test_widget_toggle_functionality(self, chrome_driver, utils, test_config):
        """Test opening and closing the chat widget"""
        self.utils = utils
        
        self.log_test_step("Loading test page")
        chrome_driver.get(test_config["widget_test_url"])
        self.wait_for_page_load(chrome_driver)
        
        self.log_test_step("Finding chat toggle button")
        toggle_button = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
        
        self.log_test_step("Clicking to open chat window")
        utils.safe_click(chrome_driver, toggle_button)
        
        self.log_test_step("Verifying chat window appears")
        self.assert_element_visible(chrome_driver, By.CSS_SELECTOR, "[data-testid='chat-window']")
        
        self.take_screenshot(chrome_driver, "chat_window_open")
        
        self.log_test_step("Clicking to close chat window")
        utils.safe_click(chrome_driver, toggle_button)
        
        # Chat window should be hidden (not visible)
        time.sleep(1)  # Wait for close animation
        chat_windows = chrome_driver.find_elements(By.CSS_SELECTOR, "[data-testid='chat-window']")
        assert len(chat_windows) == 0, "Chat window should be hidden when toggled closed"
        
        self.verify_no_console_errors(chrome_driver)
    
    def test_connection_status_display(self, chrome_driver, utils, test_config):
        """Test that connection status is properly displayed"""
        self.utils = utils
        
        self.log_test_step("Loading test page")
        chrome_driver.get(test_config["widget_test_url"])
        self.wait_for_page_load(chrome_driver)
        
        self.log_test_step("Opening chat window")
        toggle_button = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
        utils.safe_click(chrome_driver, toggle_button)
        
        self.log_test_step("Checking connection status")
        # Wait for connection status to appear
        status_element = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, ".status")
        
        # Wait for either "Online" or "Connecting..." status
        max_wait = 15  # seconds
        connected = False
        for _ in range(max_wait):
            status_text = status_element.text
            if "Online" in status_text:
                connected = True
                break
            elif "Connection Error" in status_text:
                # Connection failed - check if retry button appears
                self.log_test_step("Connection error detected, checking for retry functionality")
                break
            time.sleep(1)
        
        self.take_screenshot(chrome_driver, "connection_status")
        
        # Log final status for debugging
        final_status = status_element.text
        self.log_test_step(f"Final connection status: {final_status}")
        
        # At minimum, status should show some indication
        assert final_status.strip() != "", "Connection status should display some text"
    
    def test_message_input_functionality(self, chrome_driver, utils, test_config):
        """Test message input field functionality"""
        self.utils = utils
        
        self.log_test_step("Loading test page and opening chat")
        chrome_driver.get(test_config["widget_test_url"])
        self.wait_for_page_load(chrome_driver)
        
        toggle_button = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
        utils.safe_click(chrome_driver, toggle_button)
        
        self.log_test_step("Finding message input field")
        message_input = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='message-input']")
        
        self.log_test_step("Testing message input")
        message_input.clear()
        message_input.send_keys(self.test_message)
        
        # Verify text was entered
        assert message_input.get_attribute("value") == self.test_message
        
        self.log_test_step("Finding send button")
        send_button = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='send-button']")
        
        # Check if send button is enabled/disabled based on connection
        send_enabled = send_button.is_enabled()
        self.log_test_step(f"Send button enabled: {send_enabled}")
        
        self.take_screenshot(chrome_driver, "message_input_filled")
        
        # Test Enter key functionality
        self.log_test_step("Testing Enter key to send message")
        message_input.clear()
        message_input.send_keys("Test Enter key")
        message_input.send_keys(Keys.ENTER)
        
        # If connected, message should be sent
        time.sleep(2)
        input_value_after_enter = message_input.get_attribute("value")
        
        if send_enabled:
            # If send button was enabled, input should be cleared after Enter
            assert input_value_after_enter == "", "Message input should be cleared after sending with Enter key"
        
        self.verify_no_console_errors(chrome_driver)
    
    def test_user_switching_functionality(self, chrome_driver, utils, test_config):
        """Test switching between different user emails"""
        self.utils = utils
        
        self.log_test_step("Loading test page")
        chrome_driver.get(test_config["widget_test_url"])
        self.wait_for_page_load(chrome_driver)
        
        # Test the user switching buttons
        self.log_test_step("Testing user switching buttons")
        user_buttons = chrome_driver.find_elements(By.CSS_SELECTOR, ".email-inputs button")
        
        assert len(user_buttons) > 0, "Should have user switching buttons on test page"
        
        for i, button in enumerate(user_buttons[:2]):  # Test first 2 buttons
            self.log_test_step(f"Clicking user button {i+1}: {button.text}")
            utils.safe_click(chrome_driver, button)
            
            # Wait a moment for widget to reinitialize
            time.sleep(2)
            
            # Verify chat button is still visible
            self.assert_element_visible(chrome_driver, By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
            
            # Open chat and verify it works
            toggle_button = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
            utils.safe_click(chrome_driver, toggle_button)
            
            self.assert_element_visible(chrome_driver, By.CSS_SELECTOR, "[data-testid='chat-window']")
            
            # Close chat for next iteration
            utils.safe_click(chrome_driver, toggle_button)
            time.sleep(1)
        
        self.take_screenshot(chrome_driver, "user_switching_test")
        self.verify_no_console_errors(chrome_driver)
    
    def test_widget_responsive_behavior(self, chrome_driver, utils, test_config):
        """Test widget behavior at different screen sizes"""
        self.utils = utils
        
        screen_sizes = [
            (1920, 1080, "desktop"),
            (768, 1024, "tablet"),
            (375, 667, "mobile")
        ]
        
        for width, height, device_type in screen_sizes:
            self.log_test_step(f"Testing {device_type} size: {width}x{height}")
            
            chrome_driver.set_window_size(width, height)
            chrome_driver.get(test_config["widget_test_url"])
            self.wait_for_page_load(chrome_driver)
            
            # Verify chat button is visible
            self.assert_element_visible(chrome_driver, By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
            
            # Open chat window
            toggle_button = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
            utils.safe_click(chrome_driver, toggle_button)
            
            # Verify chat window appears and is properly sized
            chat_window = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, "[data-testid='chat-window']")
            
            # Check if window dimensions are reasonable for screen size
            window_rect = chat_window.rect
            assert window_rect['width'] > 0, f"Chat window should have width on {device_type}"
            assert window_rect['height'] > 0, f"Chat window should have height on {device_type}"
            
            self.take_screenshot(chrome_driver, f"responsive_{device_type}")
            
            # Close for next test
            utils.safe_click(chrome_driver, toggle_button)
            time.sleep(1)
        
        self.verify_no_console_errors(chrome_driver)
    
    def test_widget_position_variants(self, chrome_driver, utils, test_config):
        """Test widget positioning (if configurable)"""
        self.utils = utils
        
        self.log_test_step("Testing widget position")
        chrome_driver.get(test_config["widget_test_url"])
        self.wait_for_page_load(chrome_driver)
        
        # Find chat widget container
        widget_container = utils.wait_for_element(chrome_driver, By.CSS_SELECTOR, ".chat-widget")
        
        # Check positioning classes
        widget_classes = widget_container.get_attribute("class")
        self.log_test_step(f"Widget classes: {widget_classes}")
        
        # Verify position is either left or right
        has_position = "chat-widget-right" in widget_classes or "chat-widget-left" in widget_classes
        assert has_position, "Widget should have positioning class"
        
        # Check position in viewport
        widget_rect = widget_container.rect
        viewport_width = chrome_driver.execute_script("return window.innerWidth")
        
        # Should be positioned near edge of screen
        is_right_positioned = widget_rect['x'] > viewport_width * 0.8
        is_left_positioned = widget_rect['x'] < viewport_width * 0.2
        
        assert is_right_positioned or is_left_positioned, "Widget should be positioned at screen edge"
        
        self.take_screenshot(chrome_driver, "widget_positioning")
        self.verify_no_console_errors(chrome_driver)