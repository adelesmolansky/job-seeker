#!/usr/bin/env python3
"""
LinkedIn Jobs Scraper using linkedin-jobs-scraper package
Scrapes job postings from LinkedIn and saves them to CSV files
"""

import logging
import json
import csv
import os
from datetime import datetime
from typing import List, Dict, Any
from linkedin_jobs_scraper import LinkedinScraper
from linkedin_jobs_scraper.events import Events, EventData, EventMetrics
from linkedin_jobs_scraper.query import Query, QueryOptions, QueryFilters
from linkedin_jobs_scraper.filters import (
    RelevanceFilters,
    TimeFilters,
    TypeFilters,
    ExperienceLevelFilters,
    OnSiteOrRemoteFilters,
    SalaryBaseFilters,
)


class LinkedInJobScraper:
    """LinkedIn Jobs Scraper class"""

    def __init__(
        self, headless: bool = True, max_workers: int = 1, slow_mo: float = 0.5
    ):
        """
        Initialize the LinkedIn scraper

        Args:
            headless: Run browser in headless mode
            max_workers: Number of concurrent workers
            slow_mo: Delay between actions to avoid rate limiting
        """
        self.scraper = LinkedinScraper(
            chrome_executable_path=None,
            chrome_binary_location=None,
            chrome_options=None,
            headless=headless,
            max_workers=max_workers,
            slow_mo=slow_mo,
            page_load_timeout=40,
        )

        self.jobs_data = []
        self.setup_event_handlers()

        # Configure logging
        logging.basicConfig(
            level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
        )
        self.logger = logging.getLogger(__name__)

    def setup_event_handlers(self):
        """Setup event handlers for the scraper"""
        # Use lambda functions to properly bind instance methods
        self.scraper.on(Events.DATA, lambda data: self.on_data(data))
        self.scraper.on(Events.ERROR, lambda error: self.on_error(error))
        self.scraper.on(Events.END, lambda: self.on_end())
        self.scraper.on(Events.METRICS, lambda metrics: self.on_metrics(metrics))

    def on_data(self, data: EventData):
        """Handle job data events"""
        job_data = {
            "job_id": data.job_id,
            "title": data.title,
            "company": data.company,
            "company_link": data.company_link,
            "company_img_link": data.company_img_link,
            "place": data.place,
            "description": data.description,
            "description_html": data.description_html,
            "date": data.date,
            "date_text": data.date_text,
            "link": data.link,
            "apply_link": data.apply_link,
            "insights": data.insights,
            "scraped_at": datetime.now().isoformat(),
        }

        self.jobs_data.append(job_data)
        self.logger.info(f"Scraped job: {data.title} at {data.company}")

    def on_metrics(self, metrics: EventMetrics):
        """Handle metrics events"""
        self.logger.info(f"Page metrics: {metrics}")

    def on_error(self, error):
        """Handle error events"""
        self.logger.error(f"Scraper error: {error}")

    def on_end(self):
        """Handle end events"""
        self.logger.info("Scraping completed")

    def create_queries(
        self,
        search_terms: List[str],
        locations: List[str] = None,
        limit: int = 100,
        filters: Dict[str, Any] = None,
    ) -> List[Query]:
        """
        Create search queries for the scraper

        Args:
            search_terms: List of job titles/keywords to search for
            locations: List of locations to search in
            limit: Maximum number of jobs to scrape per query
            filters: Additional filters to apply

        Returns:
            List of Query objects
        """
        queries = []

        for term in search_terms:
            query_filters = QueryFilters()

            # Apply custom filters if provided
            if filters:
                if "relevance" in filters:
                    query_filters.relevance = filters["relevance"]
                if "time" in filters:
                    query_filters.time = filters["time"]
                if "type" in filters:
                    query_filters.type = filters["type"]
                if "experience" in filters:
                    query_filters.experience = filters["experience"]
                if "remote" in filters:
                    query_filters.on_site_or_remote = filters["remote"]
                if "salary" in filters:
                    query_filters.base_salary = filters["salary"]

            query = Query(
                query=term,
                options=QueryOptions(
                    locations=locations or ["United States"],
                    limit=limit,
                    apply_link=True,
                    skip_promoted_jobs=True,
                    filters=query_filters,
                ),
            )
            queries.append(query)

        return queries

    def scrape_jobs(
        self,
        search_terms: List[str],
        locations: List[str] = None,
        limit: int = 100,
        filters: Dict[str, Any] = None,
    ) -> List[Dict[str, Any]]:
        """
        Scrape jobs based on search criteria

        Args:
            search_terms: List of job titles/keywords to search for
            locations: List of locations to search in
            limit: Maximum number of jobs to scrape per query
            filters: Additional filters to apply

        Returns:
            List of scraped job data
        """
        self.jobs_data = []  # Reset data

        queries = self.create_queries(search_terms, locations, limit, filters)

        try:
            self.logger.info(f"Starting to scrape {len(queries)} queries...")
            self.scraper.run(queries)
            self.logger.info(f"Successfully scraped {len(self.jobs_data)} jobs")
            return self.jobs_data
        except Exception as e:
            self.logger.error(f"Error during scraping: {e}")
            return []

    def save_to_csv(self, filename: str = None) -> str:
        """
        Save scraped jobs to CSV file

        Args:
            filename: Output filename (optional)

        Returns:
            Path to saved CSV file
        """
        if not self.jobs_data:
            self.logger.warning("No jobs data to save")
            return ""

        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"linkedin_jobs_{timestamp}.csv"

        filepath = os.path.join(os.path.dirname(__file__), filename)

        # Define CSV fields
        fieldnames = [
            "job_id",
            "title",
            "company",
            "company_link",
            "company_img_link",
            "place",
            "description",
            "date",
            "date_text",
            "link",
            "apply_link",
            "insights",
            "scraped_at",
        ]

        try:
            with open(filepath, "w", newline="", encoding="utf-8") as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()

                for job in self.jobs_data:
                    # Clean the data for CSV
                    clean_job = {}
                    for field in fieldnames:
                        value = job.get(field, "")
                        if isinstance(value, str):
                            # Remove newlines and quotes from description
                            value = (
                                value.replace("\n", " ")
                                .replace("\r", " ")
                                .replace('"', '""')
                            )
                        clean_job[field] = value

                    writer.writerow(clean_job)

            self.logger.info(f"Jobs data saved to {filepath}")
            return filepath
        except Exception as e:
            self.logger.error(f"Error saving to CSV: {e}")
            return ""

    def save_to_json(self, filename: str = None) -> str:
        """
        Save scraped jobs to JSON file

        Args:
            filename: Output filename (optional)

        Returns:
            Path to saved JSON file
        """
        if not self.jobs_data:
            self.logger.warning("No jobs data to save")
            return ""

        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"linkedin_jobs_{timestamp}.json"

        filepath = os.path.join(os.path.dirname(__file__), filename)

        try:
            with open(filepath, "w", encoding="utf-8") as jsonfile:
                json.dump(self.jobs_data, jsonfile, indent=2, ensure_ascii=False)

            self.logger.info(f"Jobs data saved to {filepath}")
            return filepath
        except Exception as e:
            self.logger.error(f"Error saving to JSON: {e}")
            return ""

    def close(self):
        """Close the scraper and cleanup resources"""
        if hasattr(self.scraper, "close"):
            self.scraper.close()


def main():
    """Main function to demonstrate usage"""

    # Example search terms for AI/tech jobs
    search_terms = [
        "AI Engineer",
        "Machine Learning Engineer",
        "Data Scientist",
        "Software Engineer",
        "Product Manager",
    ]

    # Example locations
    locations = ["United States", "Remote"]

    # Example filters
    filters = {
        "relevance": RelevanceFilters.RECENT,
        "time": TimeFilters.MONTH,
        "type": [TypeFilters.FULL_TIME],
        "experience": [ExperienceLevelFilters.MID_SENIOR],
        "remote": [OnSiteOrRemoteFilters.REMOTE],
        "salary": SalaryBaseFilters.SALARY_100K,
    }

    # Initialize scraper
    scraper = LinkedInJobScraper(headless=True, max_workers=1, slow_mo=1.0)

    try:
        # Scrape jobs
        jobs = scraper.scrape_jobs(
            search_terms=search_terms,
            locations=locations,
            limit=50,  # Limit per search term
            filters=filters,
        )

        if jobs:
            print(f"Successfully scraped {len(jobs)} jobs")

            # Save to both formats
            csv_file = scraper.save_to_csv()
            json_file = scraper.save_to_json()

            print(f"Data saved to:")
            print(f"  CSV: {csv_file}")
            print(f"  JSON: {json_file}")
        else:
            print("No jobs were scraped")

    except KeyboardInterrupt:
        print("\nScraping interrupted by user")
    except Exception as e:
        print(f"Error during scraping: {e}")
    finally:
        scraper.close()


if __name__ == "__main__":
    main()
