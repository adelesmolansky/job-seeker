#!/usr/bin/env python3
"""
Test Data Processing Script
Demonstrates data processing with existing LinkedIn scraped data
"""

import os
import sys
from data_processor import LinkedInDataProcessor


def test_data_processing():
    """Test the data processing functionality"""

    print("🧪 Testing LinkedIn Data Processing")
    print("=" * 50)

    # Check if we have LinkedIn data to process
    linkedin_files = []
    for file in os.listdir("."):
        if file.startswith("ai_jobs_") and (
            file.endswith(".csv") or file.endswith(".json")
        ):
            linkedin_files.append(file)

    if not linkedin_files:
        print("❌ No LinkedIn data files found to process")
        print("   Please run the scraper first to generate data files")
        return False

    print(f"📁 Found {len(linkedin_files)} LinkedIn data files:")
    for file in linkedin_files:
        print(f"   • {file}")

    # Use the first CSV file for testing
    test_file = None
    for file in linkedin_files:
        if file.endswith(".csv"):
            test_file = file
            break

    if not test_file:
        print("❌ No CSV files found for testing")
        return False

    print(f"\n🔧 Testing with file: {test_file}")

    try:
        # Initialize processor without OpenAI (for testing)
        print("   Initializing data processor...")
        processor = LinkedInDataProcessor()

        # Process the data
        print("   Processing LinkedIn data...")
        stats = processor.process_linkedin_data(test_file)

        # Show processing results
        print("\n📊 Processing Results:")
        print(f"   • Total jobs scraped: {stats['total_scraped']}")
        print(f"   • US jobs found: {stats['us_jobs']}")
        print(f"   • Duplicates removed: {stats['duplicates_removed']}")
        print(f"   • New jobs to add: {stats['new_jobs_added']}")
        print(f"   • New companies found: {stats['new_companies_found']}")

        # Show sample of new data
        if processor.new_jobs:
            print(f"\n📋 Sample new jobs to be added:")
            for i, job in enumerate(processor.new_jobs[:3]):
                print(f"   {i+1}. {job['name']} at {job['company']}")

            if len(processor.new_jobs) > 3:
                print(f"   ... and {len(processor.new_jobs) - 3} more jobs")

        if processor.new_companies:
            print(f"\n🏢 New companies found:")
            for company in processor.new_companies[:3]:
                print(f"   • {company['name']} ({company['industry']})")

            if len(processor.new_companies) > 3:
                print(f"   ... and {len(processor.new_companies) - 3} more companies")

        # Ask user if they want to save the data
        print(f"\n💾 Data processing test complete!")
        print(f"   The processor found {stats['new_jobs_added']} new jobs to add")
        print(f"   and {stats['new_companies_found']} new companies to enrich")

        # Don't actually save during testing - just show what would happen
        print(f"\n⚠️  This was a test run - no data was actually saved")
        print(
            f"   To save the data, run the integration script or use the processor directly"
        )

        return True

    except Exception as e:
        print(f"❌ Error during data processing test: {e}")
        return False


def main():
    """Main function"""
    print("LinkedIn Data Processing Test")
    print(
        "This script tests the data processing functionality with existing scraped data"
    )
    print()

    success = test_data_processing()

    if success:
        print("\n✅ Test completed successfully!")
        print("\nNext steps:")
        print("1. To process and save data: python data_processor.py <linkedin_file>")
        print(
            "2. To run full workflow: python integrate_linkedin_data.py --scenario <scenario>"
        )
        print("3. For company enrichment: Add --openai-key YOUR_API_KEY")
    else:
        print("\n❌ Test failed. Check the errors above.")

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
