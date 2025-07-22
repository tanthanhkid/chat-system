import pytest
import time
import logging
from datetime import datetime
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class BaseTest:
    """Base test class with common functionality"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.start_time = datetime.now()
        logging.info(f"Starting test: {self.__class__.__name__}")
    
    def teardown_method(self):
        """Cleanup after each test method"""
        end_time = datetime.now()
        duration = end_time - self.start_time
        logging.info(f"Test completed in {duration.total_seconds():.2f} seconds")
    
    def log_test_step(self, step_description):
        """Log test step for debugging"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        logging.info(f"[{timestamp}] {step_description}")
        print(f"[{timestamp}] {step_description}")
    
    def assert_element_visible(self, driver, by, value, timeout=10):
        """Assert element is visible within timeout"""
        try:
            self.utils.wait_for_element(driver, by, value, timeout)
            return True
        except TimeoutException:
            pytest.fail(f"Element not visible: {by}={value}")
    
    def assert_element_clickable(self, driver, by, value, timeout=10):
        """Assert element is clickable within timeout"""
        try:
            self.utils.wait_for_clickable(driver, by, value, timeout)
            return True
        except TimeoutException:
            pytest.fail(f"Element not clickable: {by}={value}")
    
    def assert_text_in_element(self, driver, by, value, expected_text, timeout=10):
        """Assert expected text appears in element"""
        try:
            self.utils.wait_for_text_in_element(driver, by, value, expected_text, timeout)
            return True
        except TimeoutException:
            element = driver.find_element(by, value)
            actual_text = element.text
            pytest.fail(f"Expected text '{expected_text}' not found in element. Actual text: '{actual_text}'")
    
    def get_console_logs(self, driver):
        """Get browser console logs"""
        try:
            logs = driver.get_log('browser')
            return [log for log in logs if log['level'] in ['SEVERE', 'WARNING']]
        except Exception as e:
            logging.warning(f"Could not retrieve console logs: {e}")
            return []
    
    def check_for_js_errors(self, driver):
        """Check for JavaScript errors in console"""
        logs = self.get_console_logs(driver)
        js_errors = [log for log in logs if log['level'] == 'SEVERE']
        
        if js_errors:
            error_messages = [log['message'] for log in js_errors]
            logging.warning(f"JavaScript errors detected: {error_messages}")
            return js_errors
        return []
    
    def wait_for_page_load(self, driver, timeout=30):
        """Wait for page to be fully loaded"""
        try:
            from selenium.webdriver.support.ui import WebDriverWait
            wait = WebDriverWait(driver, timeout)
            
            # Wait for document ready state
            wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
            
            # Wait for jQuery if present
            try:
                wait.until(lambda d: d.execute_script("return typeof jQuery != 'undefined' && jQuery.active == 0"))
            except:
                pass  # jQuery not present, that's fine
            
            # Small additional wait for dynamic content
            time.sleep(0.5)
            
        except TimeoutException:
            logging.warning("Page load timeout - proceeding anyway")
    
    def scroll_to_element(self, driver, element):
        """Scroll element into view"""
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
        time.sleep(0.2)  # Brief pause for scroll animation
    
    def take_screenshot(self, driver, name_suffix=""):
        """Take screenshot with descriptive name"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        test_name = self.__class__.__name__
        screenshot_name = f"{test_name}_{name_suffix}_{timestamp}.png"
        screenshot_path = f"test-results/screenshots/{screenshot_name}"
        
        try:
            driver.save_screenshot(screenshot_path)
            logging.info(f"Screenshot saved: {screenshot_path}")
            return screenshot_path
        except Exception as e:
            logging.error(f"Failed to save screenshot: {e}")
            return None
    
    def verify_no_console_errors(self, driver):
        """Verify no severe console errors occurred"""
        js_errors = self.check_for_js_errors(driver)
        if js_errors:
            error_messages = "\n".join([log['message'] for log in js_errors])
            pytest.fail(f"JavaScript errors detected:\n{error_messages}")
    
    def get_network_performance(self, driver):
        """Get basic network performance metrics"""
        try:
            navigation_timing = driver.execute_script("""
                return {
                    loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
                    domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
                    firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
                }
            """)
            return navigation_timing
        except Exception as e:
            logging.warning(f"Could not get performance metrics: {e}")
            return None