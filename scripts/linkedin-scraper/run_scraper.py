#!/usr/bin/env python3
"""
LinkedIn Scraper Runner
Runs different scraping scenarios based on configuration
"""

import argparse
import time
import sys
import os
from datetime import datetime
from linkedin_scraper import LinkedInJobScraper
from config import SCRAPING_SCENARIOS, SAFETY_SETTINGS, DEFAULT_SETTINGS


def run_scenario(
    scenario_name: str, safety_level: str = "moderate", output_dir: str = None
):
    """
    Run a specific scraping scenario

    Args:
        scenario_name: Name of the scenario to run
        safety_level: Safety level (conservative, moderate, aggressive)
        output_dir: Directory to save output files
    """

    if scenario_name not in SCRAPING_SCENARIOS:
        print(f"Error: Unknown scenario '{scenario_name}'")
        print(f"Available scenarios: {', '.join(SCRAPING_SCENARIOS.keys())}")
        return False

    if safety_level not in SAFETY_SETTINGS:
        print(f"Error: Unknown safety level '{safety_level}'")
        print(f"Available safety levels: {', '.join(SAFETY_SETTINGS.keys())}")
        return False

    scenario = SCRAPING_SCENARIOS[scenario_name]
    safety = SAFETY_SETTINGS[safety_level]

    print(f"Running scenario: {scenario_name}")
    print(f"Description: {scenario['description']}")
    print(f"Safety level: {safety_level}")
    print(f"Search terms: {', '.join(scenario['search_terms'])}")
    print(f"Locations: {', '.join(scenario['locations'])}")
    print(f"Limit per query: {scenario['limit']}")
    print(f"Safety settings: {safety}")
    print("-" * 50)

    # Initialize scraper with safety settings
    scraper = LinkedInJobScraper(
        headless=DEFAULT_SETTINGS["headless"],
        max_workers=safety["max_workers"],
        slow_mo=safety["slow_mo"],
    )

    try:
        # Run the scraping
        start_time = time.time()
        jobs = scraper.scrape_jobs(
            search_terms=scenario["search_terms"],
            locations=scenario["locations"],
            limit=scenario["limit"],
            filters=scenario["filters"],
        )
        end_time = time.time()

        if jobs:
            print(
                f"\n✅ Successfully scraped {len(jobs)} jobs in {end_time - start_time:.2f} seconds"
            )

            # Create output directory if specified
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir)

            # Save files
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            base_filename = f"{scenario_name}_{timestamp}"

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

            print(f"📁 Data saved to:")
            print(f"   CSV: {csv_file}")
            print(f"   JSON: {json_file}")

            # Show some sample data
            print(f"\n📊 Sample jobs scraped:")
            for i, job in enumerate(jobs[:3]):
                print(f"   {i+1}. {job['title']} at {job['company']} ({job['place']})")

            if len(jobs) > 3:
                print(f"   ... and {len(jobs) - 3} more jobs")

            return True
        else:
            print("❌ No jobs were scraped")
            return False

    except KeyboardInterrupt:
        print("\n⚠️  Scraping interrupted by user")
        return False
    except Exception as e:
        print(f"❌ Error during scraping: {e}")
        return False
    finally:
        scraper.close()


def list_scenarios():
    """List all available scraping scenarios"""
    print("Available scraping scenarios:")
    print("-" * 50)

    for name, config in SCRAPING_SCENARIOS.items():
        print(f"📋 {name}")
        print(f"   Description: {config['description']}")
        print(f"   Search terms: {len(config['search_terms'])} terms")
        print(f"   Locations: {len(config['locations'])} locations")
        print(f"   Limit per query: {config['limit']}")
        print()


def list_safety_levels():
    """List all available safety levels"""
    print("Available safety levels:")
    print("-" * 30)

    for level, config in SAFETY_SETTINGS.items():
        print(f"🛡️  {level}")
        print(f"   Slow motion: {config['slow_mo']}s")
        print(f"   Max workers: {config['max_workers']}")
        print(f"   Limit per query: {config['limit_per_query']}")
        print(f"   Delay between queries: {config['delay_between_queries']}s")
        print()


def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description="LinkedIn Jobs Scraper Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_scraper.py --scenario ai_jobs_junior
  python run_scraper.py --scenario ai_jobs_mid_senior --safety conservative
  python run_scraper.py --scenario ai_jobs_senior_executive --safety aggressive --output ./results
  python run_scraper.py --list-scenarios
  python run_scraper.py --list-safety
        """,
    )

    parser.add_argument("--scenario", "-s", help="Scraping scenario to run")

    parser.add_argument(
        "--safety",
        "-l",
        default="moderate",
        choices=["conservative", "moderate", "aggressive"],
        help="Safety level (default: moderate)",
    )

    parser.add_argument("--output", "-o", help="Output directory for saved files")

    parser.add_argument(
        "--list-scenarios", action="store_true", help="List all available scenarios"
    )

    parser.add_argument(
        "--list-safety", action="store_true", help="List all available safety levels"
    )

    args = parser.parse_args()

    # Handle list commands
    if args.list_scenarios:
        list_scenarios()
        return

    if args.list_safety:
        list_safety_levels()
        return

    # Check if scenario is provided
    if not args.scenario:
        print("Error: Please specify a scenario to run")
        print("Use --list-scenarios to see available options")
        print("Use --help for more information")
        return 1

    # Run the scenario
    success = run_scenario(args.scenario, args.safety, args.output)
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
