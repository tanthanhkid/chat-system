#!/usr/bin/env python3
"""
Real-time monitoring test to catch contamination bug with enhanced logging
This test will keep browsers open for manual inspection
"""
import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

class RealtimeMonitorTest:
    def __init__(self):
        self.chrome_options = Options()
        self.chrome_options.add_argument('--no-sandbox')
        self.chrome_options.add_argument('--disable-dev-shm-usage')
        # Enable more verbose logging
        self.chrome_options.add_argument('--enable-console-logging')
        self.chrome_options.add_argument('--log-level=0')
        
    def create_driver(self):
        return webdriver.Chrome(options=self.chrome_options)
        
    def inject_monitoring_script(self, admin_driver):
        """Inject JavaScript monitoring into admin page"""
        monitoring_script = """
        // Enhanced monitoring for message contamination
        window.messageMonitor = {
            messages: [],
            selectedConversation: null,
            
            logMessage: function(type, data) {
                const timestamp = new Date().toISOString();
                const logEntry = {
                    timestamp,
                    type,
                    data,
                    selectedConversation: this.selectedConversation
                };
                this.messages.push(logEntry);
                console.log('🔥 MESSAGE_MONITOR:', JSON.stringify(logEntry));
                return logEntry;
            },
            
            updateSelectedConversation: function(convId) {
                this.selectedConversation = convId;
                this.logMessage('CONVERSATION_SELECTED', { conversationId: convId });
            },
            
            newMessageReceived: function(message) {
                this.logMessage('NEW_MESSAGE_RECEIVED', {
                    messageConvId: message.conversation_id,
                    currentSelected: this.selectedConversation,
                    userEmail: message.userEmail,
                    content: message.content.substring(0, 30),
                    willDisplay: message.conversation_id === this.selectedConversation
                });
            },
            
            getMonitorData: function() {
                return this.messages;
            },
            
            clearMonitor: function() {
                this.messages = [];
            }
        };
        
        // Hook into React (if available) or listen for DOM changes
        console.log('🔥 MESSAGE_MONITOR: Monitoring script injected');
        
        // Monitor DOM changes for message additions
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && node.getAttribute('data-testid')) {
                            const testId = node.getAttribute('data-testid');
                            if (testId.startsWith('admin-message-')) {
                                window.messageMonitor.logMessage('DOM_MESSAGE_ADDED', {
                                    testId: testId,
                                    content: node.textContent.substring(0, 50)
                                });
                            }
                        }
                    });
                }
            });
        });
        
        // Start observing the messages container
        const messagesContainer = document.querySelector('[data-testid="admin-messages"]');
        if (messagesContainer) {
            observer.observe(messagesContainer, { childList: true, subtree: true });
            console.log('🔥 MESSAGE_MONITOR: DOM observer active');
        }
        """
        
        admin_driver.execute_script(monitoring_script)
        time.sleep(1)
        
    def get_monitor_data(self, admin_driver):
        """Get monitoring data from injected script"""
        try:
            data = admin_driver.execute_script("return window.messageMonitor ? window.messageMonitor.getMonitorData() : [];")
            return data or []
        except Exception as e:
            print(f"Error getting monitor data: {e}")
            return []
            
    def monitor_contamination_realtime(self):
        """Real-time monitoring test with manual inspection capability"""
        
        print("\n" + "="*80)
        print("🔥 REAL-TIME CONTAMINATION MONITORING TEST")
        print("="*80)
        
        admin_driver = self.create_driver()
        user_driver = self.create_driver()
        
        try:
            # Step 1: Setup admin with monitoring
            print("🔧 Setting up admin interface with monitoring...")
            admin_driver.get("http://localhost:3000")
            time.sleep(3)
            
            # Inject monitoring script
            self.inject_monitoring_script(admin_driver)
            
            connection_status = admin_driver.find_element(By.CSS_SELECTOR, ".connection-status")
            print(f"   Admin status: {connection_status.text}")
            
            # Step 2: Admin opens User1 conversation
            print("\n📂 Admin opening User1 conversation...")
            user1_conv = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='conversation-user1@example.com']")
            user1_conv.click()
            time.sleep(2)
            
            # Update monitor with selected conversation
            admin_driver.execute_script("""
                if (window.messageMonitor) {
                    window.messageMonitor.updateSelectedConversation('b875fda1-be74-465c-b7e1-15171fcf02fe');
                }
            """)
            
            initial_messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='admin-message-']")
            initial_count = len(initial_messages)
            print(f"   Initial message count: {initial_count}")
            
            # Step 3: Open User2 interface  
            print("\n👤 Opening User2 interface...")
            user_driver.get("http://localhost:5500/test-embedding.html")
            time.sleep(2)
            
            user2_btn = user_driver.find_element(By.XPATH, "//button[text()='User 2']")
            user2_btn.click()
            time.sleep(1)
            
            chat_toggle = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='chat-toggle-button']")
            chat_toggle.click()
            time.sleep(2)
            
            print("   User2 chat widget opened")
            
            # Step 4: Interactive monitoring
            print("\n" + "="*60)
            print("🎯 INTERACTIVE CONTAMINATION TEST")
            print("="*60)
            print("Admin interface: User1 conversation is open")
            print("User interface: User2 chat widget is open")
            print()
            print("Now I'll send a User2 message and monitor in real-time...")
            
            # Send User2 message
            message_input = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='message-input']")
            send_button = user_driver.find_element(By.CSS_SELECTOR, "[data-testid='send-button']")
            
            test_message = f"REALTIME_TEST_{int(time.time())}"
            message_input.clear()
            message_input.send_keys(test_message)
            
            print(f"🚀 Sending User2 message: '{test_message}'")
            send_button.click()
            
            # Monitor real-time changes
            print("\n⏱️  Monitoring for 5 seconds...")
            for i in range(5):
                time.sleep(1)
                current_messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='admin-message-']")
                current_count = len(current_messages)
                
                if current_count != initial_count:
                    print(f"   Second {i+1}: Message count changed! {initial_count} → {current_count}")
                    
                    # Check if contamination occurred
                    for msg in current_messages[initial_count:]:
                        if test_message in msg.text:
                            print(f"   🚨 CONTAMINATION DETECTED!")
                            print(f"   User2 message found in User1's chat: '{msg.text[:60]}...'")
                            break
                else:
                    print(f"   Second {i+1}: No change (count: {current_count})")
            
            # Get monitoring data
            print("\n📊 Getting monitoring data...")
            monitor_data = self.get_monitor_data(admin_driver)
            
            if monitor_data:
                print(f"   Captured {len(monitor_data)} monitoring events:")
                for event in monitor_data[-10:]:  # Last 10 events
                    print(f"   [{event['timestamp'][11:19]}] {event['type']}: {json.dumps(event['data'], indent=2)}")
            else:
                print("   No monitoring data captured")
            
            # Final check
            print("\n🔍 Final contamination check...")
            final_messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='admin-message-']")
            contamination_found = False
            
            for msg in final_messages:
                if test_message in msg.text:
                    contamination_found = True
                    print(f"   ❌ CONTAMINATION CONFIRMED: '{test_message}' found in User1's chat")
                    break
            
            if not contamination_found:
                print(f"   ✅ NO CONTAMINATION: '{test_message}' not found in User1's chat")
                
            # Check User2's conversation
            print("\n🔍 Verifying message is in User2's conversation...")
            user2_conv = admin_driver.find_element(By.CSS_SELECTOR, "[data-testid='conversation-user2@example.com']")
            user2_conv.click()
            time.sleep(2)
            
            user2_messages = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='admin-message-']")
            user2_has_message = any(test_message in msg.text for msg in user2_messages)
            
            if user2_has_message:
                print("   ✅ Message correctly found in User2's conversation")
            else:
                print("   ❌ Message NOT found in User2's conversation")
            
            print("\n" + "="*60)
            print("🔚 REAL-TIME MONITORING COMPLETE")
            print("="*60)
            
            if contamination_found:
                print("❌ RESULT: CONTAMINATION BUG DETECTED")
                print("   The message appeared in the wrong conversation")
                return False
            else:
                print("✅ RESULT: NO CONTAMINATION BUG")
                print("   Message isolation working correctly")
                return True
                
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False
            
        finally:
            input("\nPress Enter to close browsers and finish test...")
            admin_driver.quit()
            user_driver.quit()

if __name__ == "__main__":
    monitor = RealtimeMonitorTest()
    monitor.monitor_contamination_realtime()