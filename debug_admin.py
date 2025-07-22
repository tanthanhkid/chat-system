#!/usr/bin/env python3
"""
Simple debugging test to see what admin interface shows
"""
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

def debug_admin_interface():
    """Check what admin interface shows"""
    options = Options()
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=options)
    
    try:
        print("Opening admin interface...")
        driver.get("http://localhost:3000")
        time.sleep(3)
        
        # Check if admin is connected
        try:
            connection_status = driver.find_element(By.CSS_SELECTOR, ".connection-status")
            print(f"Connection status: {connection_status.text}")
        except Exception as e:
            print(f"No connection status found: {e}")
        
        # Get all conversation elements
        try:
            conversations = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-']")
            print(f"Found {len(conversations)} conversations")
            
            for i, conv in enumerate(conversations):
                print(f"  {i+1}. {conv.text}")
        except Exception as e:
            print(f"No conversations found: {e}")
        
        # Get page source to see the full HTML
        print("\n=== ADMIN PAGE SOURCE ===")
        print(driver.page_source[:1000] + "..." if len(driver.page_source) > 1000 else driver.page_source)
        
        # Take a screenshot for debugging
        driver.save_screenshot("/tmp/admin_debug.png")
        print("Screenshot saved to /tmp/admin_debug.png")
        
    finally:
        driver.quit()

if __name__ == "__main__":
    debug_admin_interface()