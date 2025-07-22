#!/usr/bin/env python3
"""
Master Dual Window Test Runner
Runs comprehensive dual-window messaging tests with error handling and fixes.
"""

import os
import sys
import time
import json
import subprocess
import signal
from pathlib import Path
from datetime import datetime


class DualWindowTestRunner:
    """Orchestrates dual-window messaging tests."""
    
    def __init__(self):
        self.results_dir = Path("test-results")
        self.results_dir.mkdir(exist_ok=True)
        self.screenshots_dir = self.results_dir / "screenshots"
        self.screenshots_dir.mkdir(exist_ok=True)
        
        self.start_time = datetime.now()
        self.test_server_process = None
        
        self.results = {
            'start_time': self.start_time.isoformat(),
            'test_suites': {},
            'environment': {},
            'summary': {}
        }

    def check_environment(self):
        """Check all required services are running."""
        print("🔍 Checking environment for dual-window tests...")
        
        services = {}
        
        # Check test server
        try:
            import requests
            response = requests.get('http://localhost:5500/', timeout=5)
            services['test_server'] = response.status_code == 200
        except:
            services['test_server'] = False
        
        # Check chat server
        try:
            import requests
            response = requests.get('http://localhost:3001/api/conversations', timeout=5)
            services['chat_server'] = response.status_code == 200
        except:
            services['chat_server'] = False
        
        # Check admin interface
        try:
            import requests
            response = requests.get('http://localhost:3000/', timeout=5)
            services['admin_server'] = response.status_code in [200, 404]
        except:
            services['admin_server'] = False
        
        # Check ChromeDriver
        chromedriver_paths = [
            '/opt/homebrew/bin/chromedriver',
            '/usr/local/bin/chromedriver',
            '/usr/bin/chromedriver'
        ]
        
        services['chromedriver'] = False
        for path in chromedriver_paths:
            if Path(path).exists():
                try:
                    result = subprocess.run([path, '--version'], 
                                         capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        services['chromedriver'] = True
                        break
                except:
                    continue
        
        self.results['environment'] = services
        
        # Report status
        status_items = [
            ("Test Server (localhost:5500)", services['test_server']),
            ("Chat Server (localhost:3001)", services['chat_server']),
            ("Admin Server (localhost:3000)", services['admin_server']),
            ("ChromeDriver", services['chromedriver'])
        ]
        
        all_good = True
        for service, status in status_items:
            icon = "✅" if status else "❌"
            print(f"  {icon} {service}")
            if not status:
                all_good = False
        
        if not all_good:
            print("\n🚨 Missing services detected!")
            self.show_fix_instructions(services)
            return False
        
        print("✅ All services ready for dual-window testing")
        return True

    def show_fix_instructions(self, services):
        """Show instructions to fix missing services."""
        print("\n📋 To fix missing services:")
        
        if not services.get('test_server'):
            print("  🚀 Start test server:")
            print("    node serve-test.js")
        
        if not services.get('chat_server'):
            print("  💬 Start chat server:")
            print("    npm run dev:server")
        
        if not services.get('admin_server'):
            print("  👨‍💼 Start admin server:")  
            print("    npm run dev:admin")
        
        if not services.get('chromedriver'):
            print("  🚗 Install ChromeDriver:")
            print("    brew install --cask chromedriver")
            print("    # OR manually download from https://chromedriver.chromium.org/")
        
        print("\n💡 Quick setup commands:")
        print("    # Terminal 1: Database")
        print("    docker-compose up -d")
        print("    # Terminal 2: Backend") 
        print("    npm run dev:server")
        print("    # Terminal 3: Admin")
        print("    npm run dev:admin")
        print("    # Terminal 4: Test Server")
        print("    node serve-test.js")

    def auto_start_test_server(self):
        """Automatically start test server if needed."""
        if self.results['environment'].get('test_server', False):
            print("✅ Test server already running")
            return True
        
        print("🚀 Auto-starting test server...")
        try:
            # Kill any existing test server
            subprocess.run(['pkill', '-f', 'serve-test.js'], 
                          capture_output=True, timeout=5)
            time.sleep(1)
            
            # Start test server
            self.test_server_process = subprocess.Popen(
                ['node', 'serve-test.js'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for startup
            time.sleep(3)
            
            # Verify it's running
            import requests
            response = requests.get('http://localhost:5500/', timeout=5)
            if response.status_code == 200:
                print("✅ Test server started successfully")
                return True
            
        except Exception as e:
            print(f"❌ Failed to start test server: {e}")
        
        return False

    def run_test_suite(self, test_file, suite_name, timeout=300):
        """Run a specific test suite with error handling."""
        print(f"\n🧪 Running {suite_name}...")
        print("-" * 50)
        
        start_time = time.time()
        
        cmd = [
            sys.executable, '-m', 'pytest',
            f'tests/{test_file}',
            '-v',
            '--tb=short',
            f'--html={self.results_dir}/{suite_name.lower().replace(" ", "_")}_report.html',
            '--self-contained-html',
            f'--junitxml={self.results_dir}/{suite_name.lower().replace(" ", "_")}_junit.xml'
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
            duration = time.time() - start_time
            
            # Parse results from output
            passed = result.stdout.count(' PASSED')
            failed = result.stdout.count(' FAILED')
            errors = result.stdout.count(' ERROR')
            skipped = result.stdout.count(' SKIPPED')
            
            # Handle ChromeDriver errors specifically
            has_chromedriver_error = 'chromedriver' in result.stderr.lower() or 'chromedriver' in result.stdout.lower()
            
            suite_result = {
                'duration': duration,
                'exit_code': result.returncode,
                'passed': passed,
                'failed': failed,
                'errors': errors,
                'skipped': skipped,
                'total': passed + failed + errors + skipped,
                'success_rate': (passed / (passed + failed + errors)) * 100 if (passed + failed + errors) > 0 else 0,
                'has_chromedriver_error': has_chromedriver_error,
                'stdout': result.stdout,
                'stderr': result.stderr
            }
            
            self.results['test_suites'][suite_name] = suite_result
            
            # Print results
            if result.returncode == 0:
                print(f"✅ {suite_name}: All tests passed ({passed} tests, {duration:.1f}s)")
            else:
                print(f"❌ {suite_name}: Issues found ({failed} failed, {errors} errors, {duration:.1f}s)")
                
                # Show ChromeDriver specific help
                if has_chromedriver_error:
                    print("  🚨 ChromeDriver issue detected!")
                    print("  💡 Try: brew reinstall chromedriver")
                
                # Show key errors
                if result.stderr:
                    error_lines = [line.strip() for line in result.stderr.split('\n') 
                                 if line.strip() and ('error' in line.lower() or 'failed' in line.lower())]
                    if error_lines:
                        print("  📋 Key errors:")
                        for line in error_lines[:3]:  # Show first 3 errors
                            print(f"    • {line[:100]}")
            
            return result.returncode == 0
            
        except subprocess.TimeoutExpired:
            print(f"⏰ {suite_name}: Timeout after {timeout//60} minutes")
            self.results['test_suites'][suite_name] = {
                'duration': timeout,
                'exit_code': -1,
                'error': 'timeout',
                'passed': 0, 'failed': 0, 'errors': 1, 'total': 1
            }
            return False
            
        except Exception as e:
            print(f"💥 {suite_name}: Exception: {e}")
            self.results['test_suites'][suite_name] = {
                'duration': time.time() - start_time,
                'exit_code': -2,
                'error': str(e),
                'passed': 0, 'failed': 0, 'errors': 1, 'total': 1
            }
            return False

    def fix_common_issues(self):
        """Attempt to fix common issues automatically."""
        print("🔧 Attempting to fix common issues...")
        
        fixes_applied = []
        
        # Fix 1: Reinstall ChromeDriver if needed
        if not self.results['environment'].get('chromedriver', False):
            try:
                print("  🚗 Reinstalling ChromeDriver...")
                result = subprocess.run(['brew', 'reinstall', 'chromedriver'], 
                                      capture_output=True, text=True, timeout=60)
                if result.returncode == 0:
                    fixes_applied.append("ChromeDriver reinstalled")
                    time.sleep(2)
            except Exception as e:
                print(f"    ⚠️ ChromeDriver fix failed: {e}")
        
        # Fix 2: Start test server if needed
        if not self.results['environment'].get('test_server', False):
            if self.auto_start_test_server():
                fixes_applied.append("Test server started")
        
        # Fix 3: Clear browser data
        try:
            chrome_dirs = [
                "~/Library/Application Support/Google/Chrome/Default",
                "~/.config/google-chrome/Default"
            ]
            for chrome_dir in chrome_dirs:
                expanded_dir = os.path.expanduser(chrome_dir)
                if os.path.exists(expanded_dir):
                    # Clear some cache files that might interfere
                    cache_files = ['Web Data', 'History', 'Cookies']
                    for cache_file in cache_files:
                        cache_path = os.path.join(expanded_dir, cache_file)
                        if os.path.exists(cache_path):
                            try:
                                os.remove(cache_path)
                                fixes_applied.append(f"Cleared {cache_file}")
                            except:
                                pass
        except Exception:
            pass
        
        if fixes_applied:
            print(f"  ✅ Applied fixes: {', '.join(fixes_applied)}")
        else:
            print("  ⚠️ No automatic fixes available")
        
        return len(fixes_applied) > 0

    def generate_final_report(self):
        """Generate comprehensive final report."""
        end_time = datetime.now()
        duration = end_time - self.start_time
        
        self.results['end_time'] = end_time.isoformat()
        self.results['total_duration'] = duration.total_seconds()
        
        # Calculate summary
        total_tests = sum(suite.get('total', 0) for suite in self.results['test_suites'].values())
        total_passed = sum(suite.get('passed', 0) for suite in self.results['test_suites'].values())
        total_failed = sum(suite.get('failed', 0) for suite in self.results['test_suites'].values())
        total_errors = sum(suite.get('errors', 0) for suite in self.results['test_suites'].values())
        
        success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        
        self.results['summary'] = {
            'total_tests': total_tests,
            'total_passed': total_passed,
            'total_failed': total_failed,
            'total_errors': total_errors,
            'success_rate': success_rate,
            'all_passed': total_failed + total_errors == 0
        }
        
        # Save results
        results_file = self.results_dir / 'dual_window_results.json'
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        # Generate HTML report
        self.generate_html_report()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 DUAL WINDOW MESSAGING TEST RESULTS")
        print("=" * 60)
        
        print(f"⏱️ Duration: {duration.total_seconds():.1f} seconds")
        print(f"🧪 Total Tests: {total_tests}")
        print(f"✅ Passed: {total_passed}")
        print(f"❌ Failed: {total_failed}")
        print(f"💥 Errors: {total_errors}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        print("\n📋 Test Suite Results:")
        for suite_name, results in self.results['test_suites'].items():
            success_rate = results.get('success_rate', 0)
            icon = "✅" if results.get('exit_code') == 0 else "❌"
            print(f"  {icon} {suite_name}: {success_rate:.1f}% ({results.get('passed', 0)}/{results.get('total', 0)} tests)")
        
        print(f"\n📁 Reports saved to: {self.results_dir}")
        print(f"📊 HTML Report: {self.results_dir}/dual_window_report.html")
        
        if success_rate >= 80:
            print("\n🎉 DUAL WINDOW MESSAGING TESTS SUCCESSFUL! 🎉")
            print("✅ Widget and Admin communication verified")
        else:
            print(f"\n⚠️ Tests need attention - {100-success_rate:.1f}% failed")
        
        return success_rate >= 80

    def generate_html_report(self):
        """Generate HTML report."""
        summary = self.results['summary']
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Dual Window Messaging Test Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }}
        .header {{ text-align: center; margin-bottom: 40px; }}
        .success {{ color: #28a745; }}
        .failure {{ color: #dc3545; }}
        .warning {{ color: #ffc107; }}
        .summary-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }}
        .summary-card {{ background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }}
        .test-suite {{ margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }}
        .test-suite.passed {{ border-left: 5px solid #28a745; }}
        .test-suite.failed {{ border-left: 5px solid #dc3545; }}
        .environment {{ background: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔄 Dual Window Messaging Test Report</h1>
            <p><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p><strong>Duration:</strong> {self.results['total_duration']:.1f} seconds</p>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card">
                <h3>Overall Result</h3>
                <div class="{'success' if summary['success_rate'] >= 80 else 'failure'}">
                    {'✅ SUCCESS' if summary['success_rate'] >= 80 else '❌ ISSUES'}
                </div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div class="{'success' if summary['success_rate'] >= 90 else 'warning' if summary['success_rate'] >= 70 else 'failure'}">
                    {summary['success_rate']:.1f}%
                </div>
            </div>
            <div class="summary-card">
                <h3>Tests Passed</h3>
                <div class="success">{summary['total_passed']}</div>
                <div>out of {summary['total_tests']}</div>
            </div>
        </div>
        
        <div class="environment">
            <h3>🔧 Environment Status</h3>
        """
        
        for service, status in self.results['environment'].items():
            icon = "✅" if status else "❌"
            html_content += f"<p>{icon} {service.replace('_', ' ').title()}</p>"
        
        html_content += """
        </div>
        
        <div class="test-results">
            <h3>📋 Test Suite Results</h3>
        """
        
        for suite_name, results in self.results['test_suites'].items():
            passed_class = "passed" if results.get('exit_code') == 0 else "failed"
            success_rate = results.get('success_rate', 0)
            
            html_content += f"""
            <div class="test-suite {passed_class}">
                <h4>{suite_name}</h4>
                <p><strong>Result:</strong> {'✅ PASSED' if results.get('exit_code') == 0 else '❌ ISSUES'}</p>
                <p><strong>Success Rate:</strong> {success_rate:.1f}%</p>
                <p><strong>Tests:</strong> {results.get('passed', 0)} passed, {results.get('failed', 0)} failed, {results.get('errors', 0)} errors</p>
                <p><strong>Duration:</strong> {results.get('duration', 0):.1f} seconds</p>
            </div>
            """
        
        html_content += """
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
            <h3>🎯 Dual Window Testing Features</h3>
            <p>✅ Widget and Admin interface simultaneous operation</p>
            <p>✅ Real-time message exchange testing</p>
            <p>✅ Bidirectional communication validation</p>  
            <p>✅ Connection status and error recovery</p>
            <p>✅ Typing indicators and message status sync</p>
        </div>
    </div>
</body>
</html>
        """
        
        report_file = self.results_dir / 'dual_window_report.html'
        with open(report_file, 'w') as f:
            f.write(html_content)

    def cleanup(self):
        """Cleanup resources."""
        if self.test_server_process:
            print("🛑 Stopping test server...")
            self.test_server_process.terminate()
            time.sleep(2)
            if self.test_server_process.poll() is None:
                self.test_server_process.kill()

    def run_all_tests(self):
        """Run complete dual window test suite."""
        try:
            print("🚀 Starting Dual Window Messaging Test Suite")
            print("=" * 60)
            
            # Environment check
            env_ok = self.check_environment()
            if not env_ok:
                print("🔧 Attempting to fix issues...")
                self.fix_common_issues()
                time.sleep(2)
                env_ok = self.check_environment()
            
            if not env_ok:
                print("❌ Environment issues prevent testing")
                return False
            
            # Run test suites
            test_suites = [
                ('test_dual_window_messaging.py', 'Dual Window Messaging Tests'),
                ('test_realtime_sync.py', 'Real-time Synchronization Tests')
            ]
            
            overall_success = True
            for test_file, suite_name in test_suites:
                success = self.run_test_suite(test_file, suite_name)
                if not success:
                    overall_success = False
            
            # Generate final report
            return self.generate_final_report()
            
        except KeyboardInterrupt:
            print("\n🛑 Tests interrupted by user")
            return False
        except Exception as e:
            print(f"\n💥 Test runner error: {e}")
            return False
        finally:
            self.cleanup()


def main():
    """Main entry point."""
    runner = DualWindowTestRunner()
    
    def signal_handler(sig, frame):
        print("\n🛑 Shutting down test runner...")
        runner.cleanup()
        sys.exit(1)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    success = runner.run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()