import pytest
import os
import time
import json
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

# Test configuration
TEST_CONFIG = {
    "server_url": "http://localhost:3001",
    "admin_url": "http://localhost:3000",
    "widget_test_url": "file://" + os.path.abspath("test-embedding.html"),
    "timeout": 10,
    "screenshot_dir": "test-results/screenshots",
    "reports_dir": "test-results/reports",
    "logs_dir": "test-results/logs"
}

@pytest.fixture(scope="session")
def test_config():
    return TEST_CONFIG

@pytest.fixture(scope="session")
def setup_directories():
    """Ensure test result directories exist"""
    for dir_path in [TEST_CONFIG["screenshot_dir"], TEST_CONFIG["reports_dir"], TEST_CONFIG["logs_dir"]]:
        os.makedirs(dir_path, exist_ok=True)

@pytest.fixture
def chrome_driver(setup_directories):
    """Create Chrome WebDriver instance with optimized settings"""
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")  # Use new headless mode
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-web-security")
    chrome_options.add_argument("--allow-running-insecure-content")
    chrome_options.add_argument("--disable-features=VizDisplayCompositor")
    
    # Enable logging
    chrome_options.add_argument("--enable-logging")
    chrome_options.add_argument("--v=1")
    
    # Try system ChromeDriver first, then fallback to webdriver-manager
    try:
        # First try system-installed ChromeDriver
        system_chromedriver = "/opt/homebrew/bin/chromedriver"
        if os.path.exists(system_chromedriver):
            service = Service(system_chromedriver)
        else:
            # Fallback to webdriver-manager
            service = Service(ChromeDriverManager().install())
        
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.implicitly_wait(5)
        
        yield driver
        
        driver.quit()
        
    except Exception as e:
        # Final fallback: try without service
        print(f"ChromeDriver setup failed: {e}")
        print("Trying fallback Chrome setup...")
        
        try:
            driver = webdriver.Chrome(options=chrome_options)
            driver.implicitly_wait(5)
            yield driver
            driver.quit()
        except Exception as e2:
            pytest.skip(f"Could not initialize Chrome WebDriver: {e2}")

@pytest.fixture
def wait(chrome_driver):
    """WebDriverWait instance"""
    return WebDriverWait(chrome_driver, TEST_CONFIG["timeout"])

@pytest.fixture(autouse=True)
def capture_screenshot_on_failure(request, chrome_driver):
    """Automatically capture screenshot on test failure"""
    yield
    
    if request.node.rep_call.failed:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        test_name = request.node.name
        screenshot_name = f"{test_name}_{timestamp}.png"
        screenshot_path = os.path.join(TEST_CONFIG["screenshot_dir"], screenshot_name)
        
        try:
            chrome_driver.save_screenshot(screenshot_path)
            print(f"Screenshot saved: {screenshot_path}")
        except Exception as e:
            print(f"Failed to capture screenshot: {e}")

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Make test result available for screenshot capture"""
    outcome = yield
    rep = outcome.get_result()
    setattr(item, "rep_" + rep.when, rep)

@pytest.fixture(scope="session")
def test_results():
    """Collect test results for final report"""
    results = {
        "start_time": datetime.now(),
        "tests": [],
        "summary": {
            "total": 0,
            "passed": 0,
            "failed": 0,
            "skipped": 0
        }
    }
    yield results
    
    # Generate final report
    results["end_time"] = datetime.now()
    results["duration"] = str(results["end_time"] - results["start_time"])
    
    report_path = os.path.join(TEST_CONFIG["reports_dir"], f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    with open(report_path, 'w') as f:
        json.dump(results, f, indent=2, default=str)

class TestUtils:
    """Utility functions for tests"""
    
    @staticmethod
    def wait_for_element(driver, by, value, timeout=10):
        """Wait for element to be present and visible"""
        wait = WebDriverWait(driver, timeout)
        return wait.until(EC.visibility_of_element_located((by, value)))
    
    @staticmethod
    def wait_for_clickable(driver, by, value, timeout=10):
        """Wait for element to be clickable"""
        wait = WebDriverWait(driver, timeout)
        return wait.until(EC.element_to_be_clickable((by, value)))
    
    @staticmethod
    def safe_click(driver, element):
        """Safely click an element with JS fallback"""
        try:
            element.click()
        except Exception:
            driver.execute_script("arguments[0].click();", element)
    
    @staticmethod
    def wait_for_text_in_element(driver, by, value, text, timeout=10):
        """Wait for specific text to appear in element"""
        wait = WebDriverWait(driver, timeout)
        return wait.until(EC.text_to_be_present_in_element((by, value), text))

@pytest.fixture
def utils():
    """Test utilities"""
    return TestUtils