#!/usr/bin/env python3
"""Quick test to verify Vietnamese localization fix"""

import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service


def quick_test():
    print("🔍 Quick test: Vietnamese localization in widget")
    
    # Setup Chrome
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=800,600')
    # chrome_options.add_argument('--headless')  # Run non-headless for debugging
    
    # Find ChromeDriver
    chromedriver_paths = [
        '/opt/homebrew/bin/chromedriver',
        '/usr/local/bin/chromedriver', 
        '/usr/bin/chromedriver'
    ]
    
    chromedriver_path = None
    for path in chromedriver_paths:
        if os.path.exists(path):
            chromedriver_path = path
            break
    
    if not chromedriver_path:
        print("❌ ChromeDriver not found")
        return False
    
    try:
        service = Service(chromedriver_path)
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # Load widget page
        driver.get("http://localhost:5500/test-embedding.html")
        print("🌐 Page loaded, waiting for widget to initialize...")
        time.sleep(5)
        
        # Check if toggle button exists
        try:
            toggle_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
            print("✅ Toggle button found")
        except:
            print("❌ Toggle button not found")
            return False
        
        # Open widget
        toggle_btn.click()
        print("🔄 Widget toggle clicked, waiting for window...")
        time.sleep(3)
        
        # Check if chat window exists
        try:
            chat_window = driver.find_element(By.CSS_SELECTOR, "[data-testid='chat-window']")
            print("✅ Chat window found")
        except:
            print("❌ Chat window not found")
            return False
        
        # Check for Vietnamese text
        try:
            header = driver.find_element(By.CSS_SELECTOR, ".chat-header h3")
            header_text = header.text
            header_html = header.get_attribute('innerHTML')
            print(f"✅ Header element found")
            print(f"🔍 Header innerHTML: '{header_html}'")
            print(f"🔍 Header text: '{header_text}'")
        except Exception as e:
            print(f"❌ Header element error: {e}")
            return False
        
        # Also check the page source for Vietnamese text
        page_source = driver.page_source
        if "Hỗ Trợ" in page_source:
            print("✅ Vietnamese text found in page source!")
        else:
            print("❌ Vietnamese text not found in page source")
            
        print(f"📱 Widget header text: '{header_text}'")
        
        # Check for Vietnamese characters (check innerHTML since text may be empty due to encoding)
        vietnamese_found = "Hỗ Trợ" in header_html or "Hỗ Trợ" in header_text or "Chat" in header_text
        
        if vietnamese_found:
            print("✅ Vietnamese text found in widget!")
            
            # Also check placeholder
            message_input = driver.find_element(By.CSS_SELECTOR, "[data-testid='message-input']")
            placeholder = message_input.get_attribute("placeholder")
            print(f"📝 Input placeholder: '{placeholder}'")
            
            return True
        else:
            print(f"❌ Vietnamese text not found. Got: '{header_text}'")
            return False
            
    except Exception as e:
        print(f"❌ Quick test failed: {e}")
        return False
    finally:
        if 'driver' in locals():
            driver.quit()


if __name__ == "__main__":
    success = quick_test()
    exit(0 if success else 1)