#!/usr/bin/env python3
"""
Test script to verify LinkedIn scraper setup
Checks dependencies and basic functionality
"""

import sys
import importlib
import subprocess


def check_python_version():
    """Check if Python version is compatible"""
    print("🐍 Checking Python version...")

    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 7):
        print(f"❌ Python {version.major}.{version.minor} detected")
        print("   LinkedIn scraper requires Python 3.7 or higher")
        return False
    else:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} - Compatible")
        return True


def check_dependencies():
    """Check if required packages are installed"""
    print("\n📦 Checking dependencies...")

    required_packages = [
        "linkedin_jobs_scraper",
        "selenium",
        "webdriver_manager",
        "pandas",
        "requests",
    ]

    missing_packages = []

    for package in required_packages:
        try:
            importlib.import_module(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - Not installed")
            missing_packages.append(package)

    if missing_packages:
        print(f"\n⚠️  Missing packages: {', '.join(missing_packages)}")
        print("   Install them using: pip install -r requirements.txt")
        return False
    else:
        print("\n✅ All required packages are installed")
        return True


def check_chrome():
    """Check if Chrome/Chromium is available"""
    print("\n🌐 Checking Chrome/Chromium availability...")

    try:
        # Try to import webdriver_manager to check Chrome availability
        from webdriver_manager.chrome import ChromeDriverManager
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options

        # Check if ChromeDriver can be downloaded
        driver_path = ChromeDriverManager().install()
        print(f"✅ ChromeDriver available at: {driver_path}")

        # Try to create a Chrome instance (headless)
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")

        try:
            driver = webdriver.Chrome(options=chrome_options)
            driver.quit()
            print("✅ Chrome browser test successful")
            return True
        except Exception as e:
            print(f"⚠️  Chrome browser test failed: {e}")
            print("   You may need to install Chrome or Chromium")
            return False

    except Exception as e:
        print(f"❌ Chrome check failed: {e}")
        print("   Make sure Chrome/Chromium is installed")
        return False


def test_imports():
    """Test if our scraper modules can be imported"""
    print("\n🔧 Testing scraper imports...")

    try:
        from linkedin_scraper import LinkedInJobScraper

        print("✅ LinkedInJobScraper imported successfully")

        from config import SCRAPING_SCENARIOS, SAFETY_SETTINGS

        print("✅ Configuration imported successfully")

        return True
    except Exception as e:
        print(f"❌ Import test failed: {e}")
        return False


def main():
    """Main test function"""
    print("🧪 LinkedIn Scraper Setup Test")
    print("=" * 40)

    tests = [check_python_version, check_dependencies, check_chrome, test_imports]

    passed = 0
    total = len(tests)

    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with error: {e}")

    print("\n" + "=" * 40)
    print(f"📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! Your LinkedIn scraper is ready to use.")
        print("\nNext steps:")
        print("1. Run: python run_scraper.py --list-scenarios")
        print("2. Try: python run_scraper.py --scenario ai_jobs_junior")
    else:
        print("⚠️  Some tests failed. Please fix the issues above.")
        print("\nCommon solutions:")
        print("1. Install missing packages: pip install -r requirements.txt")
        print("2. Install Chrome/Chromium browser")
        print("3. Check Python version compatibility")

    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
