#!/usr/bin/env python3
"""
LinkedIn Data Integration Script
Combines scraping and data processing in one workflow
"""

import os
import sys
import argparse
from datetime import datetime
from linkedin_scraper import LinkedInJobScraper
from data_processor import LinkedInDataProcessor
from config import SCRAPING_SCENARIOS, SAFETY_SETTINGS


def scrape_and_process(
    scenario_name: str,
    safety_level: str = "moderate",
    openai_api_key: str = None,
    output_dir: str = None,
):
    """
    Scrape LinkedIn data and process it in one workflow

    Args:
        scenario_name: Name of the scraping scenario
        safety_level: Safety level for scraping
        openai_api_key: OpenAI API key for company enrichment
        output_dir: Directory to save output files
    """

    print(f"🚀 Starting LinkedIn Data Integration Workflow")
    print(f"📋 Scenario: {scenario_name}")
    print(f"🛡️  Safety Level: {safety_level}")
    print(f"🔑 OpenAI: {'Enabled' if openai_api_key else 'Disabled'}")
    print("=" * 60)

    # Step 1: Scrape LinkedIn data
    print("\n📡 Step 1: Scraping LinkedIn Data...")

    if scenario_name not in SCRAPING_SCENARIOS:
        print(f"❌ Error: Unknown scenario '{scenario_name}'")
        print(f"Available scenarios: {', '.join(SCRAPING_SCENARIOS.keys())}")
        return False

    if safety_level not in SAFETY_SETTINGS:
        print(f"❌ Error: Unknown safety level '{safety_level}'")
        print(f"Available safety levels: {', '.join(SAFETY_SETTINGS.keys())}")
        return False

    scenario = SCRAPING_SCENARIOS[scenario_name]
    safety = SAFETY_SETTINGS[safety_level]

    print(f"   Description: {scenario['description']}")
    print(f"   Search terms: {', '.join(scenario['search_terms'])}")
    print(f"   Locations: {', '.join(scenario['locations'])}")
    print(f"   Limit per query: {scenario['limit']}")

    # Initialize scraper
    scraper = LinkedInJobScraper(
        headless=True, max_workers=safety["max_workers"], slow_mo=safety["slow_mo"]
    )

    try:
        # Run scraping
        jobs = scraper.scrape_jobs(
            search_terms=scenario["search_terms"],
            locations=scenario["locations"],
            limit=scenario["limit"],
            filters=scenario["filters"],
        )

        if not jobs:
            print("❌ No jobs were scraped. Exiting.")
            return False

        print(f"✅ Successfully scraped {len(jobs)} jobs")

        # Save raw data
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_filename = f"{scenario_name}_{timestamp}"

        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)

        if output_dir:
            csv_file = scraper.save_to_csv(
                os.path.join(output_dir, f"{base_filename}.csv")
            )
            json_file = scraper.save_to_json(
                os.path.join(output_dir, f"{base_filename}.json")
            )
        else:
            csv_file = scraper.save_to_csv(f"{base_filename}.csv")
            json_file = scraper.save_to_json(f"{base_filename}.json")

        print(f"📁 Raw data saved to:")
        print(f"   CSV: {csv_file}")
        print(f"   JSON: {json_file}")

    except Exception as e:
        print(f"❌ Error during scraping: {e}")
        return False
    finally:
        scraper.close()

    # Step 2: Process and integrate data
    print("\n🔧 Step 2: Processing and Integrating Data...")

    try:
        # Initialize data processor
        processor = LinkedInDataProcessor(openai_api_key=openai_api_key)

        # Process the scraped data
        stats = processor.process_linkedin_data(csv_file)

        # Save processed data to existing CSV files
        processor.save_processed_data()

        print("✅ Data processing and integration complete!")
        print("\n📊 Processing Summary:")
        print(processor.get_processing_summary())

    except Exception as e:
        print(f"❌ Error during data processing: {e}")
        return False

    print("\n🎉 LinkedIn Data Integration Workflow Complete!")
    return True


def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description="LinkedIn Data Integration - Scrape and Process in One Workflow",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python integrate_linkedin_data.py --scenario ai_jobs_junior
  python integrate_linkedin_data.py --scenario ai_jobs_mid_senior --safety conservative
  python integrate_linkedin_data.py --scenario ai_jobs_junior --openai-key YOUR_API_KEY
  python integrate_linkedin_data.py --scenario ai_jobs_mid_senior --output ./results
        """,
    )

    parser.add_argument(
        "--scenario", "-s", required=True, help="Scraping scenario to run"
    )

    parser.add_argument(
        "--safety",
        "-l",
        default="moderate",
        choices=["conservative", "moderate", "aggressive"],
        help="Safety level (default: moderate)",
    )

    parser.add_argument("--openai-key", help="OpenAI API key for company enrichment")

    parser.add_argument("--output", "-o", help="Output directory for raw scraped files")

    args = parser.parse_args()

    # Check if OpenAI key is provided
    if not args.openai_key:
        print("⚠️  Warning: No OpenAI API key provided.")
        print("   Company enrichment will use default values.")
        print("   For better results, provide an OpenAI API key with --openai-key")
        print()

    # Run the integration workflow
    success = scrape_and_process(
        scenario_name=args.scenario,
        safety_level=args.safety,
        openai_api_key=args.openai_key,
        output_dir=args.output,
    )

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
