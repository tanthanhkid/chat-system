#!/usr/bin/env python3
"""
Test runner script for chat system automation tests
"""

import os
import sys
import subprocess
import json
import time
import argparse
from datetime import datetime
from pathlib import Path

class TestRunner:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.test_results_dir = self.project_root / "test-results"
        self.reports_dir = self.test_results_dir / "reports"
        self.logs_dir = self.test_results_dir / "logs"
        self.screenshots_dir = self.test_results_dir / "screenshots"
        
        # Ensure directories exist
        for dir_path in [self.test_results_dir, self.reports_dir, self.logs_dir, self.screenshots_dir]:
            dir_path.mkdir(exist_ok=True)
    
    def check_requirements(self):
        """Check if all requirements are met"""
        print("🔍 Checking requirements...")
        
        # Check Python packages
        try:
            import selenium
            import webdriver_manager
            import pytest
            print("✅ Python packages installed")
        except ImportError as e:
            print(f"❌ Missing Python package: {e}")
            print("Run: pip install -r tests/requirements.txt")
            return False
        
        # Check if services are running
        services_status = self.check_services()
        if not services_status["all_running"]:
            print("⚠️ Some services are not running:")
            for service, status in services_status.items():
                if service != "all_running":
                    status_icon = "✅" if status else "❌"
                    print(f"  {status_icon} {service}")
            print("\nTo start services:")
            print("1. docker-compose up -d")
            print("2. npm run dev:server")
            print("3. npm run dev:admin")
            return False
        
        print("✅ All requirements met")
        return True
    
    def check_services(self):
        """Check if required services are running"""
        import requests
        
        services = {
            "Database": False,
            "Chat Server": False,
            "Admin Interface": False,
            "Test Page": False
        }
        
        # Check chat server
        try:
            response = requests.get("http://localhost:3001/api/conversations", timeout=5)
            services["Chat Server"] = response.status_code in [200, 404]  # 404 is ok, means server is running
        except:
            pass
        
        # Check admin interface
        try:
            response = requests.get("http://localhost:3000", timeout=5)
            services["Admin Interface"] = response.status_code == 200
        except:
            pass
        
        # Check test page exists
        test_page_path = self.project_root / "test-embedding.html"
        services["Test Page"] = test_page_path.exists()
        
        # Check database (indirect check via server)
        services["Database"] = services["Chat Server"]
        
        services["all_running"] = all(services.values())
        return services
    
    def run_pytest(self, test_path=None, markers=None, parallel=False):
        """Run pytest with specified options"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Build pytest command
        cmd = [
            "python3", "-m", "pytest",
            "-v",
            "--tb=short",
            f"--html={self.reports_dir}/report_{timestamp}.html",
            "--self-contained-html",
            f"--junitxml={self.reports_dir}/junit_{timestamp}.xml"
        ]
        
        if parallel:
            cmd.extend(["-n", "auto"])
        
        if markers:
            cmd.extend(["-m", markers])
        
        if test_path:
            cmd.append(test_path)
        else:
            cmd.append("tests/selenium/")
        
        # Set environment variables
        env = os.environ.copy()
        env["PYTHONPATH"] = str(self.project_root)
        
        print(f"🧪 Running tests: {' '.join(cmd)}")
        
        # Run tests
        log_file = self.logs_dir / f"test_run_{timestamp}.log"
        
        try:
            with open(log_file, "w") as f:
                result = subprocess.run(
                    cmd,
                    cwd=str(self.project_root),
                    env=env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True
                )
                
                output = result.stdout
                f.write(output)
                print(output)
                
                return {
                    "returncode": result.returncode,
                    "output": output,
                    "log_file": str(log_file),
                    "timestamp": timestamp
                }
        
        except Exception as e:
            print(f"❌ Error running tests: {e}")
            return None
    
    def generate_summary_report(self, test_results):
        """Generate comprehensive summary report"""
        timestamp = test_results["timestamp"]
        
        # Parse pytest output for summary
        output_lines = test_results["output"].split("\n")
        summary_line = None
        
        for line in output_lines:
            if "failed" in line and "passed" in line or "passed" in line and "error" in line:
                summary_line = line.strip()
                break
        
        # Count screenshots
        screenshot_count = len(list(self.screenshots_dir.glob("*.png")))
        
        # Generate HTML report
        html_report = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Chat System Test Results - {timestamp}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        .header {{ background: #f4f4f4; padding: 20px; border-radius: 8px; }}
        .section {{ margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }}
        .success {{ background: #d4edda; color: #155724; }}
        .warning {{ background: #fff3cd; color: #856404; }}
        .error {{ background: #f8d7da; color: #721c24; }}
        .code {{ background: #f8f9fa; padding: 10px; font-family: monospace; }}
        table {{ width: 100%; border-collapse: collapse; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background: #f2f2f2; }}
        .screenshot {{ max-width: 200px; max-height: 150px; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Chat System Test Results</h1>
        <p><strong>Execution Time:</strong> {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
        <p><strong>Test Run ID:</strong> {timestamp}</p>
    </div>
    
    <div class="section {'success' if test_results['returncode'] == 0 else 'error'}">
        <h2>📊 Test Summary</h2>
        <p><strong>Overall Result:</strong> {'✅ PASSED' if test_results['returncode'] == 0 else '❌ FAILED'}</p>
        <p><strong>Summary:</strong> {summary_line or 'See detailed logs for results'}</p>
        <p><strong>Screenshots Captured:</strong> {screenshot_count}</p>
        <p><strong>Exit Code:</strong> {test_results['returncode']}</p>
    </div>
    
    <div class="section">
        <h2>🔧 Test Environment</h2>
        <ul>
            <li><strong>Chat Server:</strong> http://localhost:3001</li>
            <li><strong>Admin Interface:</strong> http://localhost:3000</li>
            <li><strong>Test Framework:</strong> Selenium + pytest</li>
            <li><strong>Browser:</strong> Chrome (headless)</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>📝 Test Categories</h2>
        <table>
            <tr><th>Category</th><th>Description</th><th>Test Count</th></tr>
            <tr><td>Chat Widget</td><td>UI functionality, responsiveness, user interactions</td><td>~8 tests</td></tr>
            <tr><td>Admin Interface</td><td>Dashboard functionality, message handling, broadcasting</td><td>~8 tests</td></tr>
            <tr><td>Integration</td><td>End-to-end message flow, multi-user scenarios</td><td>~4 tests</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>📋 Detailed Logs</h2>
        <p><strong>Log File:</strong> <code>{test_results['log_file']}</code></p>
        <p><strong>HTML Report:</strong> <code>{self.reports_dir}/report_{timestamp}.html</code></p>
        <p><strong>JUnit XML:</strong> <code>{self.reports_dir}/junit_{timestamp}.xml</code></p>
    </div>
    
    <div class="section">
        <h2>🖼️ Screenshots</h2>
        <p>Screenshots are automatically captured on test failures and key steps.</p>
        <p><strong>Location:</strong> <code>{self.screenshots_dir}</code></p>
        {"<p>Recent screenshots:</p>" if screenshot_count > 0 else "<p>No screenshots captured in this run.</p>"}
        <div>
        """
        
        # Add recent screenshots
        screenshots = sorted(self.screenshots_dir.glob("*.png"), key=os.path.getmtime, reverse=True)[:10]
        for screenshot in screenshots:
            rel_path = screenshot.relative_to(self.project_root)
            html_report += f'<img src="../../{rel_path}" class="screenshot" title="{screenshot.name}"> '
        
        html_report += """
        </div>
    </div>
    
    <div class="section">
        <h2>🚨 Known Issues & Fixes Applied</h2>
        <h3>Socket Connection Improvements:</h3>
        <ul>
            <li>✅ Added automatic reconnection logic</li>
            <li>✅ Improved error handling and user feedback</li>
            <li>✅ Connection status indicators</li>
            <li>✅ Retry mechanisms for failed connections</li>
        </ul>
        
        <h3>Test Coverage:</h3>
        <ul>
            <li>✅ Widget visibility and interaction</li>
            <li>✅ Real-time message delivery</li>
            <li>✅ Admin dashboard functionality</li>
            <li>✅ Multi-user scenarios</li>
            <li>✅ Connection recovery</li>
            <li>✅ Responsive design testing</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>📈 Recommendations</h2>
        <ul>
            <li><strong>Performance:</strong> Monitor message delivery latency in production</li>
            <li><strong>Reliability:</strong> Implement heartbeat mechanism for connection monitoring</li>
            <li><strong>Scalability:</strong> Test with larger number of concurrent users</li>
            <li><strong>Security:</strong> Add input validation and rate limiting</li>
            <li><strong>User Experience:</strong> Add typing indicators and message status</li>
        </ul>
    </div>
    
    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        <p>Generated by Chat System Test Automation Framework</p>
    </footer>
</body>
</html>
        """
        
        # Save summary report
        summary_report_path = self.reports_dir / f"summary_{timestamp}.html"
        with open(summary_report_path, "w") as f:
            f.write(html_report)
        
        print(f"📊 Summary report generated: {summary_report_path}")
        return summary_report_path
    
    def run_all_tests(self, parallel=False):
        """Run all test suites"""
        print("🚀 Starting comprehensive test suite...")
        
        if not self.check_requirements():
            return False
        
        start_time = time.time()
        
        # Run tests
        test_results = self.run_pytest(parallel=parallel)
        
        if test_results:
            end_time = time.time()
            duration = end_time - start_time
            
            print(f"\n⏱️ Total execution time: {duration:.2f} seconds")
            
            # Generate summary report
            summary_report = self.generate_summary_report(test_results)
            
            # Print final results
            if test_results["returncode"] == 0:
                print("🎉 All tests passed!")
            else:
                print("⚠️ Some tests failed. Check the reports for details.")
            
            print(f"\n📊 Reports generated:")
            print(f"   Summary: {summary_report}")
            print(f"   Detailed: {self.reports_dir}")
            print(f"   Screenshots: {self.screenshots_dir}")
            
            return test_results["returncode"] == 0
        
        return False

def main():
    parser = argparse.ArgumentParser(description="Run chat system automation tests")
    parser.add_argument("--test", help="Specific test file or function to run")
    parser.add_argument("--markers", help="Pytest markers to filter tests")
    parser.add_argument("--parallel", action="store_true", help="Run tests in parallel")
    parser.add_argument("--check-only", action="store_true", help="Only check requirements")
    
    args = parser.parse_args()
    
    runner = TestRunner()
    
    if args.check_only:
        runner.check_requirements()
        return
    
    if args.test:
        # Run specific test
        test_results = runner.run_pytest(args.test, args.markers, args.parallel)
        if test_results:
            runner.generate_summary_report(test_results)
    else:
        # Run all tests
        success = runner.run_all_tests(args.parallel)
        sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()