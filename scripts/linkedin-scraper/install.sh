#!/bin/bash

# LinkedIn Scraper Installation Script
# This script installs all dependencies and sets up the environment

set -e  # Exit on any error

echo "🚀 LinkedIn Scraper Installation Script"
echo "======================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.7 or higher first."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
PYTHON_MAJOR=$(python3 -c "import sys; print(sys.version_info.major)")
PYTHON_MINOR=$(python3 -c "import sys; print(sys.version_info.minor)")

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 7 ]); then
    echo "❌ Python $PYTHON_VERSION detected. This scraper requires Python 3.7 or higher."
    exit 1
fi

echo "✅ Python $PYTHON_VERSION detected - Compatible"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip first."
    exit 1
fi

echo "✅ pip3 detected"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ Dependencies installed successfully"

# Check if Chrome/Chromium is available
echo "🌐 Checking for Chrome/Chromium..."
if command -v google-chrome &> /dev/null; then
    echo "✅ Google Chrome detected"
elif command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium detected"
elif command -v chromium &> /dev/null; then
    echo "✅ Chromium detected"
else
    echo "⚠️  Chrome/Chromium not found in PATH"
    echo "   Please install Chrome or Chromium browser"
    echo "   The scraper may still work with webdriver-manager"
fi

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x linkedin_scraper.py
chmod +x run_scraper.py
chmod +x test_setup.py

echo "✅ Scripts made executable"

# Test the installation
echo "🧪 Testing installation..."
python test_setup.py

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "Next steps:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. List available scenarios: python run_scraper.py --list-scenarios"
echo "3. Run a test scenario: python run_scraper.py --scenario ai_jobs_junior"
echo ""
echo "Note: Always activate the virtual environment before running the scraper:"
echo "   source venv/bin/activate"
echo ""
echo "Happy scraping! 🚀"
