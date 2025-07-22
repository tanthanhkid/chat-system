#!/usr/bin/env python3
"""
Full Widget Verification Suite
Runs comprehensive tests and generates 100% functionality report.
"""

import os
import sys
import time
import json
import subprocess
import signal
from datetime import datetime
from pathlib import Path


class FullVerificationRunner:
    """Runs complete widget verification test suite."""
    
    def __init__(self):
        self.results_dir = Path("test-results")
        self.results_dir.mkdir(exist_ok=True)
        self.screenshots_dir = self.results_dir / "screenshots"
        self.screenshots_dir.mkdir(exist_ok=True)
        
        self.test_server_process = None
        self.start_time = datetime.now()
        self.results = {
            'start_time': self.start_time.isoformat(),
            'tests': {},
            'summary': {},
            'environment': {}
        }

    def check_environment(self):
        """Check that all required services are running."""
        print("🔍 Checking test environment...")
        
        # Check if test server is accessible
        try:
            import requests
            response = requests.get('http://localhost:5500/', timeout=5)
            test_server_ok = response.status_code == 200
        except:
            test_server_ok = False
        
        # Check if chat server is accessible
        try:
            import requests
            response = requests.get('http://localhost:3001/api/conversations', timeout=5)
            chat_server_ok = response.status_code == 200
        except:
            chat_server_ok = False
        
        # Check if admin interface is accessible
        try:
            import requests
            response = requests.get('http://localhost:3000/', timeout=5)
            admin_server_ok = response.status_code in [200, 404]  # 404 is ok for SPA
        except:
            admin_server_ok = False
        
        # Check ChromeDriver
        chromedriver_paths = [
            '/opt/homebrew/bin/chromedriver',
            '/usr/local/bin/chromedriver', 
            '/usr/bin/chromedriver'
        ]
        
        chromedriver_ok = False
        for path in chromedriver_paths:
            if Path(path).exists():
                try:
                    result = subprocess.run([path, '--version'], 
                                         capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        chromedriver_ok = True
                        break
                except:
                    continue
        
        self.results['environment'] = {
            'test_server': test_server_ok,
            'chat_server': chat_server_ok,
            'admin_server': admin_server_ok,
            'chromedriver': chromedriver_ok
        }
        
        # Report status
        env_status = [
            ("Test Server (localhost:5500)", test_server_ok),
            ("Chat Server (localhost:3001)", chat_server_ok),
            ("Admin Server (localhost:3000)", admin_server_ok),
            ("ChromeDriver", chromedriver_ok)
        ]
        
        for service, status in env_status:
            status_icon = "✅" if status else "❌"
            print(f"  {status_icon} {service}")
        
        missing_services = [service for service, status in env_status if not status]
        
        if missing_services:
            print(f"\n⚠️ Missing services: {', '.join([s[0] for s in env_status if not s[1]])}")
            print("\n📋 To fix:")
            if not test_server_ok:
                print("  - Start test server: node serve-test.js")
            if not chat_server_ok:
                print("  - Start chat server: npm run dev:server")
            if not admin_server_ok:
                print("  - Start admin server: npm run dev:admin")
            if not chromedriver_ok:
                print("  - Install ChromeDriver: brew install --cask chromedriver")
            
            return False
        
        print("✅ All required services are running")
        return True

    def start_test_server_if_needed(self):
        """Start test server if not already running."""
        try:
            import requests
            response = requests.get('http://localhost:5500/', timeout=2)
            if response.status_code == 200:
                print("✅ Test server already running")
                return True
        except:
            pass
        
        print("🚀 Starting test server...")
        try:
            self.test_server_process = subprocess.Popen(
                ['node', 'serve-test.js'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for server to start
            time.sleep(3)
            
            # Check if it's running
            import requests
            response = requests.get('http://localhost:5500/', timeout=5)
            if response.status_code == 200:
                print("✅ Test server started successfully")
                return True
        except Exception as e:
            print(f"❌ Failed to start test server: {e}")
        
        return False

    def run_test_suite(self, test_file, suite_name):
        """Run a specific test suite."""
        print(f"\n🧪 Running {suite_name}...")
        print("-" * 50)
        
        start_time = time.time()
        
        # Run tests with detailed output
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
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            duration = time.time() - start_time
            
            # Parse results
            passed = result.stdout.count(' PASSED')
            failed = result.stdout.count(' FAILED')
            errors = result.stdout.count(' ERROR')
            skipped = result.stdout.count(' SKIPPED')
            
            suite_result = {
                'duration': duration,
                'exit_code': result.returncode,
                'passed': passed,
                'failed': failed,
                'errors': errors,
                'skipped': skipped,
                'total': passed + failed + errors + skipped,
                'success_rate': (passed / (passed + failed + errors)) * 100 if (passed + failed + errors) > 0 else 0,
                'stdout': result.stdout,
                'stderr': result.stderr
            }
            
            self.results['tests'][suite_name] = suite_result
            
            # Print summary
            if result.returncode == 0:
                print(f"✅ {suite_name}: All tests passed ({passed} tests, {duration:.1f}s)")
            else:
                print(f"❌ {suite_name}: {failed} failed, {passed} passed ({duration:.1f}s)")
                
            return result.returncode == 0
            
        except subprocess.TimeoutExpired:
            print(f"⏰ {suite_name}: Timeout after 5 minutes")
            self.results['tests'][suite_name] = {
                'duration': 300,
                'exit_code': -1,
                'error': 'timeout',
                'passed': 0,
                'failed': 0,
                'errors': 1,
                'total': 1
            }
            return False
            
        except Exception as e:
            print(f"💥 {suite_name}: Exception: {e}")
            self.results['tests'][suite_name] = {
                'duration': time.time() - start_time,
                'exit_code': -2,
                'error': str(e),
                'passed': 0,
                'failed': 0,
                'errors': 1,
                'total': 1
            }
            return False

    def run_manual_verification(self):
        """Run manual verification steps."""
        print("\n🔧 Running Manual Verification Steps...")
        print("-" * 50)
        
        verification_steps = []
        
        # Test 1: Direct widget loading
        print("🧪 Testing direct widget loading...")
        try:
            import requests
            response = requests.get('http://localhost:5500/test-embedding.html', timeout=10)
            widget_page_loads = response.status_code == 200 and 'ChatWidget' in response.text
            verification_steps.append(("Widget page loads", widget_page_loads))
            print(f"  {'✅' if widget_page_loads else '❌'} Widget page loads")
        except Exception as e:
            verification_steps.append(("Widget page loads", False))
            print(f"  ❌ Widget page loads: {e}")
        
        # Test 2: CSS and JS resources
        print("🧪 Testing widget resources...")
        try:
            css_response = requests.get('http://localhost:5500/packages/chat-widget/dist/style.css', timeout=5)
            css_loads = css_response.status_code == 200
            verification_steps.append(("CSS loads", css_loads))
            print(f"  {'✅' if css_loads else '❌'} CSS loads")
            
            js_response = requests.get('http://localhost:5500/packages/chat-widget/dist/index.umd.js', timeout=5)
            js_loads = js_response.status_code == 200
            verification_steps.append(("UMD bundle loads", js_loads))
            print(f"  {'✅' if js_loads else '❌'} UMD bundle loads")
        except Exception as e:
            verification_steps.append(("CSS loads", False))
            verification_steps.append(("UMD bundle loads", False))
            print(f"  ❌ Resource loading failed: {e}")
        
        # Test 3: API connectivity
        print("🧪 Testing API connectivity...")
        try:
            api_response = requests.get('http://localhost:3001/api/conversations', timeout=5)
            api_works = api_response.status_code == 200
            verification_steps.append(("API connectivity", api_works))
            print(f"  {'✅' if api_works else '❌'} API connectivity")
        except Exception as e:
            verification_steps.append(("API connectivity", False))
            print(f"  ❌ API connectivity: {e}")
        
        self.results['manual_verification'] = {
            'steps': verification_steps,
            'total_steps': len(verification_steps),
            'passed_steps': sum(1 for _, passed in verification_steps if passed),
            'success_rate': (sum(1 for _, passed in verification_steps if passed) / len(verification_steps)) * 100
        }

    def generate_final_report(self):
        """Generate comprehensive final report."""
        end_time = datetime.now()
        duration = end_time - self.start_time
        
        self.results['end_time'] = end_time.isoformat()
        self.results['total_duration'] = duration.total_seconds()
        
        # Calculate overall summary
        total_tests = sum(suite.get('total', 0) for suite in self.results['tests'].values())
        total_passed = sum(suite.get('passed', 0) for suite in self.results['tests'].values())
        total_failed = sum(suite.get('failed', 0) for suite in self.results['tests'].values())
        total_errors = sum(suite.get('errors', 0) for suite in self.results['tests'].values())
        
        # Add manual verification
        if 'manual_verification' in self.results:
            total_tests += self.results['manual_verification']['total_steps']
            total_passed += self.results['manual_verification']['passed_steps']
            total_failed += (self.results['manual_verification']['total_steps'] - 
                           self.results['manual_verification']['passed_steps'])
        
        overall_success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        
        self.results['summary'] = {
            'total_tests': total_tests,
            'total_passed': total_passed,
            'total_failed': total_failed,
            'total_errors': total_errors,
            'success_rate': overall_success_rate,
            'all_passed': total_failed + total_errors == 0
        }
        
        # Save results to JSON
        results_file = self.results_dir / 'full_verification_results.json'
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        # Generate HTML report
        self.generate_html_report()
        
        # Print final summary
        print("\n" + "=" * 60)
        print("📊 FULL VERIFICATION RESULTS")
        print("=" * 60)
        
        print(f"⏱️ Total Duration: {duration.total_seconds():.1f} seconds")
        print(f"🧪 Total Tests: {total_tests}")
        print(f"✅ Passed: {total_passed}")
        print(f"❌ Failed: {total_failed}")
        print(f"💥 Errors: {total_errors}")
        print(f"📈 Success Rate: {overall_success_rate:.1f}%")
        
        print("\n📋 Test Suite Results:")
        for suite_name, results in self.results['tests'].items():
            success_rate = results.get('success_rate', 0)
            icon = "✅" if results.get('exit_code') == 0 else "❌"
            print(f"  {icon} {suite_name}: {success_rate:.1f}% ({results.get('passed', 0)}/{results.get('total', 0)} tests)")
        
        if 'manual_verification' in self.results:
            manual_rate = self.results['manual_verification']['success_rate']
            icon = "✅" if manual_rate == 100 else "❌"
            print(f"  {icon} Manual Verification: {manual_rate:.1f}%")
        
        print(f"\n📁 Reports saved to: {self.results_dir}")
        print(f"📊 HTML Report: {self.results_dir}/full_verification_report.html")
        
        if overall_success_rate == 100:
            print("\n🎉 ALL TESTS PASSED - 100% WIDGET FUNCTIONALITY VERIFIED! 🎉")
        else:
            print(f"\n⚠️ {100 - overall_success_rate:.1f}% of tests failed - see reports for details")
        
        return overall_success_rate == 100

    def generate_html_report(self):
        """Generate HTML report."""
        summary = self.results['summary']
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Full Widget Verification Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }}
        .header {{ text-align: center; margin-bottom: 40px; }}
        .success {{ color: #28a745; }}
        .failure {{ color: #dc3545; }}
        .warning {{ color: #ffc107; }}
        .summary-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }}
        .summary-card {{ background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }}
        .summary-card h3 {{ margin: 0 0 10px 0; }}
        .summary-card .number {{ font-size: 2em; font-weight: bold; }}
        .test-results {{ margin: 30px 0; }}
        .test-suite {{ margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }}
        .test-suite.passed {{ border-left: 5px solid #28a745; }}
        .test-suite.failed {{ border-left: 5px solid #dc3545; }}
        .environment {{ background: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Full Widget Verification Report</h1>
            <p><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p><strong>Duration:</strong> {self.results['total_duration']:.1f} seconds</p>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card">
                <h3>Overall Result</h3>
                <div class="number {'success' if summary['all_passed'] else 'failure'}">
                    {'✅ PASS' if summary['all_passed'] else '❌ FAIL'}
                </div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div class="number {'success' if summary['success_rate'] >= 90 else 'warning' if summary['success_rate'] >= 70 else 'failure'}">
                    {summary['success_rate']:.1f}%
                </div>
            </div>
            <div class="summary-card">
                <h3>Tests Passed</h3>
                <div class="number success">{summary['total_passed']}</div>
                <div>out of {summary['total_tests']}</div>
            </div>
            <div class="summary-card">
                <h3>Tests Failed</h3>
                <div class="number {'failure' if summary['total_failed'] > 0 else 'success'}">{summary['total_failed']}</div>
            </div>
        </div>
        
        <div class="environment">
            <h3>🔧 Environment Status</h3>
        """
        
        for service, status in self.results['environment'].items():
            status_icon = "✅" if status else "❌"
            html_content += f"<p>{status_icon} {service.replace('_', ' ').title()}</p>"
        
        html_content += """
        </div>
        
        <div class="test-results">
            <h3>📋 Test Suite Results</h3>
        """
        
        for suite_name, results in self.results['tests'].items():
            passed_class = "passed" if results.get('exit_code') == 0 else "failed"
            success_rate = results.get('success_rate', 0)
            
            html_content += f"""
            <div class="test-suite {passed_class}">
                <h4>{suite_name}</h4>
                <p><strong>Result:</strong> {'✅ PASSED' if results.get('exit_code') == 0 else '❌ FAILED'}</p>
                <p><strong>Success Rate:</strong> {success_rate:.1f}%</p>
                <p><strong>Tests:</strong> {results.get('passed', 0)} passed, {results.get('failed', 0)} failed, {results.get('errors', 0)} errors</p>
                <p><strong>Duration:</strong> {results.get('duration', 0):.1f} seconds</p>
            </div>
            """
        
        if 'manual_verification' in self.results:
            manual = self.results['manual_verification']
            passed_class = "passed" if manual['success_rate'] == 100 else "failed"
            html_content += f"""
            <div class="test-suite {passed_class}">
                <h4>Manual Verification</h4>
                <p><strong>Result:</strong> {'✅ PASSED' if manual['success_rate'] == 100 else '❌ FAILED'}</p>
                <p><strong>Success Rate:</strong> {manual['success_rate']:.1f}%</p>
                <p><strong>Steps:</strong> {manual['passed_steps']} passed out of {manual['total_steps']}</p>
            </div>
            """
        
        html_content += """
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p>Generated by Chat System Full Verification Suite</p>
        </div>
    </div>
</body>
</html>
        """
        
        report_file = self.results_dir / 'full_verification_report.html'
        with open(report_file, 'w') as f:
            f.write(html_content)

    def cleanup(self):
        """Cleanup processes."""
        if self.test_server_process:
            print("🛑 Stopping test server...")
            self.test_server_process.terminate()
            time.sleep(2)
            if self.test_server_process.poll() is None:
                self.test_server_process.kill()

    def run_full_verification(self):
        """Run complete verification suite."""
        try:
            print("🚀 Starting Full Widget Verification Suite")
            print("=" * 60)
            
            # Check environment
            if not self.check_environment():
                print("❌ Environment check failed - cannot proceed")
                return False
            
            # Start test server if needed
            self.start_test_server_if_needed()
            
            # Run manual verification first
            self.run_manual_verification()
            
            # Run test suites
            test_suites = [
                ('test_widget_comprehensive.py', 'Comprehensive Widget Tests'),
                ('test_e2e_integration.py', 'End-to-End Integration Tests')
            ]
            
            all_passed = True
            for test_file, suite_name in test_suites:
                if not self.run_test_suite(test_file, suite_name):
                    all_passed = False
            
            # Generate final report
            return self.generate_final_report()
            
        except KeyboardInterrupt:
            print("\n🛑 Interrupted by user")
            return False
        except Exception as e:
            print(f"\n💥 Unexpected error: {e}")
            return False
        finally:
            self.cleanup()


def main():
    """Main entry point."""
    runner = FullVerificationRunner()
    
    # Handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        print("\n🛑 Shutting down...")
        runner.cleanup()
        sys.exit(1)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    success = runner.run_full_verification()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()