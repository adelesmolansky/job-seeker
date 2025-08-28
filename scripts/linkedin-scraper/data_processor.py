#!/usr/bin/env python3
"""
LinkedIn Data Processor
Processes scraped LinkedIn data and integrates it with existing CSV files
"""

import csv
import json
import os
import re
import uuid
from datetime import datetime
from typing import Dict, List, Set, Tuple, Optional
import pandas as pd
from openai import OpenAI
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class LinkedInDataProcessor:
    """Processes LinkedIn scraped data and integrates with existing CSV files"""

    def __init__(self, openai_api_key: str = None):
        """
        Initialize the data processor

        Args:
            openai_api_key: OpenAI API key for company enrichment
        """
        self.openai_client = None
        if openai_api_key:
            self.openai_client = OpenAI(api_key=openai_api_key)

        # Paths to CSV files
        self.csv_dir = os.path.join(os.path.dirname(__file__), "..", "csv")
        self.jobs_csv = os.path.join(self.csv_dir, "jobs.csv")
        self.companies_csv = os.path.join(self.csv_dir, "companies.csv")
        self.addresses_csv = os.path.join(self.csv_dir, "addresses.csv")

        # Load existing data
        self.existing_jobs = self._load_existing_jobs()
        self.existing_companies = self._load_existing_companies()
        self.existing_addresses = self._load_existing_addresses()

        # Track new data
        self.new_jobs = []
        self.new_companies = []
        self.new_addresses = []

        # Track statistics
        self.stats = {
            "total_scraped": 0,
            "us_jobs": 0,
            "duplicates_removed": 0,
            "new_jobs_added": 0,
            "new_companies_found": 0,
            "companies_enriched": 0,
        }

    def _load_existing_jobs(self) -> Set[Tuple[str, str]]:
        """Load existing jobs to check for duplicates"""
        existing_jobs = set()

        if os.path.exists(self.jobs_csv):
            try:
                with open(self.jobs_csv, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        # Use company + title as unique identifier
                        existing_jobs.add((row["company"], row["name"]))
                logger.info(f"Loaded {len(existing_jobs)} existing jobs")
            except Exception as e:
                logger.error(f"Error loading existing jobs: {e}")

        return existing_jobs

    def _load_existing_companies(self) -> Set[str]:
        """Load existing company names"""
        existing_companies = set()

        if os.path.exists(self.companies_csv):
            try:
                with open(self.companies_csv, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        existing_companies.add(row["name"].lower().strip())
                logger.info(f"Loaded {len(existing_companies)} existing companies")
            except Exception as e:
                logger.error(f"Error loading existing companies: {e}")

        return existing_companies

    def _load_existing_addresses(self) -> Set[Tuple[str, str, str]]:
        """Load existing addresses"""
        existing_addresses = set()

        if os.path.exists(self.addresses_csv):
            try:
                with open(self.addresses_csv, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        # Use city + state + country as unique identifier
                        existing_addresses.add(
                            (row["city"], row["state"], row["country"])
                        )
                logger.info(f"Loaded {len(existing_addresses)} existing addresses")
            except Exception as e:
                logger.error(f"Error loading existing addresses: {e}")

        return existing_addresses

    def _is_us_location(self, location: str) -> bool:
        """Check if location is in the US"""
        if not location:
            return False

        location_lower = location.lower()

        # Direct US indicators
        us_indicators = ["united states", "usa", "us", "u.s.", "u.s.a."]
        if any(indicator in location_lower for indicator in us_indicators):
            return True

        # US state abbreviations and names
        us_states = {
            "al",
            "alabama",
            "ak",
            "alaska",
            "az",
            "arizona",
            "ar",
            "arkansas",
            "ca",
            "california",
            "co",
            "colorado",
            "ct",
            "connecticut",
            "de",
            "delaware",
            "fl",
            "florida",
            "ga",
            "georgia",
            "hi",
            "hawaii",
            "id",
            "idaho",
            "il",
            "illinois",
            "in",
            "indiana",
            "ia",
            "iowa",
            "ks",
            "kansas",
            "ky",
            "kentucky",
            "la",
            "louisiana",
            "me",
            "maine",
            "md",
            "maryland",
            "ma",
            "massachusetts",
            "mi",
            "michigan",
            "mn",
            "minnesota",
            "ms",
            "mississippi",
            "mo",
            "missouri",
            "mt",
            "montana",
            "ne",
            "nebraska",
            "nv",
            "nevada",
            "nh",
            "new hampshire",
            "nj",
            "new jersey",
            "nm",
            "new mexico",
            "ny",
            "new york",
            "nc",
            "north carolina",
            "nd",
            "north dakota",
            "oh",
            "ohio",
            "ok",
            "oklahoma",
            "or",
            "oregon",
            "pa",
            "pennsylvania",
            "ri",
            "rhode island",
            "sc",
            "south carolina",
            "sd",
            "south dakota",
            "tn",
            "tennessee",
            "tx",
            "texas",
            "ut",
            "utah",
            "vt",
            "vermont",
            "va",
            "virginia",
            "wa",
            "washington",
            "wv",
            "west virginia",
            "wi",
            "wisconsin",
            "wy",
            "wyoming",
        }

        # Check for state patterns
        for state in us_states:
            if state in location_lower:
                return True

        # Check for city, state pattern (e.g., "San Francisco, CA")
        city_state_pattern = r"[A-Za-z\s]+,\s*[A-Z]{2}"
        if re.search(city_state_pattern, location):
            return True

        return False

    def _extract_location_parts(self, location: str) -> Tuple[str, str, str]:
        """Extract city, state, and country from location string"""
        if not location:
            return "Unknown", "Unknown", "Unknown"

        # Handle "City, State" format (e.g., "San Francisco, CA")
        city_state_match = re.match(r"^([^,]+),\s*([A-Z]{2})$", location.strip())
        if city_state_match:
            city = city_state_match.group(1).strip()
            state = city_state_match.group(2).strip()
            return city, state, "USA"

        # Handle "City, State, Country" format
        parts = [part.strip() for part in location.split(",")]
        if len(parts) >= 3:
            return parts[0], parts[1], parts[2]
        elif len(parts) == 2:
            # Assume second part is state if it's 2 letters, otherwise country
            if len(parts[1]) == 2 and parts[1].isupper():
                return parts[0], parts[1], "USA"
            else:
                return parts[0], "Unknown", parts[1]
        else:
            return parts[0] if parts else "Unknown", "Unknown", "Unknown"

    def _is_duplicate_job(self, company: str, title: str) -> bool:
        """Check if job already exists"""
        return (company, title) in self.existing_jobs

    def _is_new_company(self, company: str) -> bool:
        """Check if company is new"""
        return company.lower().strip() not in self.existing_companies

    def _is_new_address(self, city: str, state: str, country: str) -> bool:
        """Check if address is new"""
        return (city, state, country) not in self.existing_addresses

    def _enrich_company_with_openai(self, company_name: str) -> Dict[str, str]:
        """Enrich company information using OpenAI"""
        if not self.openai_client:
            logger.warning("OpenAI client not available, using default values")
            return self._get_default_company_data(company_name)

        try:
            prompt = f"""
            Provide company information for "{company_name}" in the following JSON format:
            {{
                "industry": "Technology/Healthcare/Finance/etc",
                "focus": "AI/ML focus areas like Machine Learning, Computer Vision, NLP, etc",
                "details": "Brief description of what the company does",
                "size": "Number of employees (just the number)",
                "stage": "Startup/Growth/Established",
                "funding": "Seed/Series A/Series B/Public/Bootstrapped",
                "founded_year": "Year founded (just the year)",
                "headquarters": "City, State, Country format",
                "website": "Company website URL"
            }}
            
            Focus on AI/ML companies and provide accurate, factual information.
            """

            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=500,
            )

            content = response.choices[0].message.content
            # Extract JSON from response
            json_match = re.search(r"\{.*\}", content, re.DOTALL)
            if json_match:
                company_data = json.loads(json_match.group())
                logger.info(f"Successfully enriched company: {company_name}")
                return company_data
            else:
                logger.warning(f"Could not extract JSON for company: {company_name}")
                return self._get_default_company_data(company_name)

        except Exception as e:
            logger.error(f"Error enriching company {company_name}: {e}")
            return self._get_default_company_data(company_name)

    def _get_default_company_data(self, company_name: str) -> Dict[str, str]:
        """Get default company data when OpenAI enrichment fails"""
        return {
            "industry": "Technology",
            "focus": "Machine Learning",
            "details": f"AI company focused on Machine Learning in the Technology industry.",
            "size": "1000",
            "stage": "Established",
            "funding": "Series A",
            "founded_year": "2020",
            "headquarters": "San Francisco, CA, USA",
            "website": f"https://{company_name.lower().replace(' ', '')}.com",
        }

    def _convert_linkedin_job_to_csv_format(
        self, job: Dict, company_id: str, address_id: str
    ) -> Dict:
        """Convert LinkedIn job data to CSV format"""
        # Generate unique ID
        job_id = str(uuid.uuid4())

        # Extract location parts
        city, state, country = self._extract_location_parts(job.get("place", ""))

        # Determine if remote
        is_remote = (
            "remote" in job.get("place", "").lower()
            or "remote" in job.get("title", "").lower()
        )

        # Clean and format description
        description = job.get("description", "")
        if description:
            # Remove extra whitespace and newlines
            description = " ".join(description.split())
            # Truncate if too long
            if len(description) > 1000:
                description = description[:997] + "..."

        # Extract responsibilities and qualifications from description
        responsibilities = self._extract_responsibilities(description)
        qualifications = self._extract_qualifications(description)
        optional_qualifications = self._extract_optional_qualifications(description)

        return {
            "id": job_id,
            "company": job.get("company", "Unknown"),
            "name": job.get("title", "Unknown"),
            "overview": (
                description[:500] if description else "No description available"
            ),
            "responsibilities": responsibilities,
            "qualifications": qualifications,
            "optional_qualifications": optional_qualifications,
            "location": address_id,
            "benefits": "Competitive salary and benefits",
            "remote": is_remote,
            "created_at": datetime.now().isoformat() + "Z",
            "updated_at": datetime.now().isoformat() + "Z",
            "is_open": True,
        }

    def _extract_responsibilities(self, description: str) -> str:
        """Extract responsibilities from job description"""
        if not description:
            return "Develop and implement AI/ML models,Collaborate with cross-functional teams"

        # Look for responsibility indicators
        responsibility_keywords = [
            "responsibilities",
            "duties",
            "will be responsible for",
            "key responsibilities",
        ]

        for keyword in responsibility_keywords:
            if keyword in description.lower():
                # Extract text after the keyword
                start_idx = description.lower().find(keyword)
                if start_idx != -1:
                    # Find the end of responsibilities section
                    end_idx = description.find("\n", start_idx)
                    if end_idx == -1:
                        end_idx = len(description)

                    responsibilities_text = description[
                        start_idx + len(keyword) : end_idx
                    ].strip()
                    if responsibilities_text:
                        # Clean and format
                        responsibilities = (
                            responsibilities_text.replace("\n", " ")
                            .replace("•", ",")
                            .replace("-", ",")
                        )
                        responsibilities = re.sub(r"\s+", " ", responsibilities).strip()
                        if len(responsibilities) > 500:
                            responsibilities = responsibilities[:497] + "..."
                        return responsibilities

        return (
            "Develop and implement AI/ML models,Collaborate with cross-functional teams"
        )

    def _extract_qualifications(self, description: str) -> str:
        """Extract qualifications from job description"""
        if not description:
            return "Bachelor's degree in Computer Science or related field,Experience with Python,Strong understanding of machine learning algorithms"

        # Look for qualification indicators
        qualification_keywords = [
            "requirements",
            "qualifications",
            "must have",
            "required",
            "minimum qualifications",
        ]

        for keyword in qualification_keywords:
            if keyword in description.lower():
                start_idx = description.lower().find(keyword)
                if start_idx != -1:
                    end_idx = description.find("\n", start_idx)
                    if end_idx == -1:
                        end_idx = len(description)

                    qualifications_text = description[
                        start_idx + len(keyword) : end_idx
                    ].strip()
                    if qualifications_text:
                        qualifications = (
                            qualifications_text.replace("\n", " ")
                            .replace("•", ",")
                            .replace("-", ",")
                        )
                        qualifications = re.sub(r"\s+", " ", qualifications).strip()
                        if len(qualifications) > 500:
                            qualifications = qualifications[:497] + "..."
                        return qualifications

        return "Bachelor's degree in Computer Science or related field,Experience with Python,Strong understanding of machine learning algorithms"

    def _extract_optional_qualifications(self, description: str) -> str:
        """Extract optional qualifications from job description"""
        if not description:
            return "Master's or PhD in AI/ML,Experience with cloud platforms,Publications in top AI conferences"

        # Look for preferred/optional indicators
        optional_keywords = [
            "preferred",
            "nice to have",
            "bonus",
            "plus",
            "optional",
            "desired",
        ]

        for keyword in optional_keywords:
            if keyword in description.lower():
                start_idx = description.lower().find(keyword)
                if start_idx != -1:
                    end_idx = description.find("\n", start_idx)
                    if end_idx == -1:
                        end_idx = len(description)

                    optional_text = description[
                        start_idx + len(keyword) : end_idx
                    ].strip()
                    if optional_text:
                        optional_quals = (
                            optional_text.replace("\n", " ")
                            .replace("•", ",")
                            .replace("-", ",")
                        )
                        optional_quals = re.sub(r"\s+", " ", optional_quals).strip()
                        if len(optional_quals) > 500:
                            optional_quals = optional_quals[:497] + "..."
                        return optional_quals

        return "Master's or PhD in AI/ML,Experience with cloud platforms,Publications in top AI conferences"

    def process_linkedin_data(self, linkedin_file: str) -> Dict:
        """
        Process LinkedIn scraped data file

        Args:
            linkedin_file: Path to LinkedIn CSV or JSON file

        Returns:
            Dictionary with processing statistics
        """
        logger.info(f"Processing LinkedIn data from: {linkedin_file}")

        # Load LinkedIn data
        linkedin_jobs = self._load_linkedin_data(linkedin_file)
        self.stats["total_scraped"] = len(linkedin_jobs)

        logger.info(f"Loaded {len(linkedin_jobs)} LinkedIn jobs")

        # Process each job
        for job in linkedin_jobs:
            company = job.get("company", "Unknown")
            title = job.get("title", "Unknown")
            location = job.get("place", "")

            # Check if US location
            if not self._is_us_location(location):
                continue

            self.stats["us_jobs"] += 1

            # Check for duplicates
            if self._is_duplicate_job(company, title):
                self.stats["duplicates_removed"] += 1
                continue

            # Process new company if needed
            company_id = self._process_company(company)

            # Process address
            address_id = self._process_address(location)

            # Convert job to CSV format
            csv_job = self._convert_linkedin_job_to_csv_format(
                job, company_id, address_id
            )
            self.new_jobs.append(csv_job)
            self.stats["new_jobs_added"] += 1

        logger.info(
            f"Processing complete. Found {self.stats['us_jobs']} US jobs, "
            f"{self.stats['duplicates_removed']} duplicates, "
            f"{self.stats['new_jobs_added']} new jobs"
        )

        return self.stats

    def _load_linkedin_data(self, file_path: str) -> List[Dict]:
        """Load LinkedIn data from CSV or JSON file"""
        if file_path.endswith(".csv"):
            return self._load_csv_data(file_path)
        elif file_path.endswith(".json"):
            return self._load_json_data(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_path}")

    def _load_csv_data(self, file_path: str) -> List[Dict]:
        """Load data from CSV file"""
        data = []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    data.append(row)
        except Exception as e:
            logger.error(f"Error loading CSV file: {e}")

        return data

    def _load_json_data(self, file_path: str) -> List[Dict]:
        """Load data from JSON file"""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading JSON file: {e}")
            return []

    def _process_company(self, company_name: str) -> str:
        """Process company and return company ID"""
        if not self._is_new_company(company_name):
            # Find existing company ID
            return self._get_existing_company_id(company_name)

        # New company - enrich with OpenAI
        logger.info(f"Processing new company: {company_name}")
        self.stats["new_companies_found"] += 1

        company_data = self._enrich_company_with_openai(company_name)
        self.stats["companies_enriched"] += 1

        # Create company record
        company_id = str(uuid.uuid4())
        company_record = {
            "id": company_id,
            "name": company_name,
            "industry": company_data.get("industry", "Technology"),
            "focus": company_data.get("focus", "Machine Learning"),
            "details": company_data.get(
                "details", f"AI company focused on Machine Learning."
            ),
            "size": company_data.get("size", "1000"),
            "stage": company_data.get("stage", "Established"),
            "funding": company_data.get("funding", "Series A"),
            "founded_year": company_data.get("founded_year", "2020"),
            "headquarters": company_data.get("headquarters", "San Francisco, CA, USA"),
            "website": company_data.get(
                "website", f'https://{company_name.lower().replace(" ", "")}.com'
            ),
            "created_at": datetime.now().isoformat() + "Z",
            "updated_at": datetime.now().isoformat() + "Z",
        }

        self.new_companies.append(company_record)
        return company_id

    def _get_existing_company_id(self, company_name: str) -> str:
        """Get existing company ID from companies.csv"""
        try:
            with open(self.companies_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row["name"].lower().strip() == company_name.lower().strip():
                        return row["id"]
        except Exception as e:
            logger.error(f"Error finding existing company ID: {e}")

        # If not found, create a new one (fallback)
        logger.warning(
            f"Company {company_name} not found in existing data, creating new record"
        )
        return self._process_company(company_name)

    def _process_address(self, location: str) -> str:
        """Process address and return address ID"""
        city, state, country = self._extract_location_parts(location)

        if not self._is_new_address(city, state, country):
            # Find existing address ID
            return self._get_existing_address_id(city, state, country)

        # New address
        address_id = str(uuid.uuid4())
        address_record = {
            "id": address_id,
            "city": city,
            "state": state,
            "country": country,
            "street_address": "Unknown",
            "created_at": datetime.now().isoformat() + "Z",
            "updated_at": datetime.now().isoformat() + "Z",
        }

        self.new_addresses.append(address_record)
        return address_id

    def _get_existing_address_id(self, city: str, state: str, country: str) -> str:
        """Get existing address ID from addresses.csv"""
        try:
            with open(self.addresses_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if (
                        row["city"] == city
                        and row["state"] == state
                        and row["country"] == country
                    ):
                        return row["id"]
        except Exception as e:
            logger.error(f"Error finding existing address ID: {e}")

        # If not found, create a new one (fallback)
        logger.warning(
            f"Address {city}, {state}, {country} not found in existing data, creating new record"
        )
        return self._process_address(f"{city}, {state}, {country}")

    def save_processed_data(self) -> None:
        """Save all processed data to CSV files"""
        logger.info("Saving processed data to CSV files...")

        # Save new companies
        if self.new_companies:
            self._append_to_csv(self.companies_csv, self.new_companies)
            logger.info(f"Added {len(self.new_companies)} new companies")

        # Save new addresses
        if self.new_addresses:
            self._append_to_csv(self.addresses_csv, self.new_addresses)
            logger.info(f"Added {len(self.new_addresses)} new addresses")

        # Save new jobs
        if self.new_jobs:
            self._append_to_csv(self.jobs_csv, self.new_jobs)
            logger.info(f"Added {len(self.new_jobs)} new jobs")

        logger.info("Data processing and saving complete!")

    def _append_to_csv(self, csv_file: str, data: List[Dict]) -> None:
        """Append data to existing CSV file"""
        if not data:
            return

        # Get fieldnames from first record
        fieldnames = list(data[0].keys())

        # Check if file exists and has headers
        file_exists = os.path.exists(csv_file)

        try:
            with open(csv_file, "a", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)

                # Write header if file is new
                if not file_exists:
                    writer.writeheader()

                # Write data
                writer.writerows(data)

        except Exception as e:
            logger.error(f"Error writing to {csv_file}: {e}")

    def get_processing_summary(self) -> str:
        """Get a summary of the processing results"""
        summary = f"""
LinkedIn Data Processing Summary
================================

📊 Processing Statistics:
• Total jobs scraped: {self.stats['total_scraped']}
• US jobs found: {self.stats['us_jobs']}
• Duplicates removed: {self.stats['duplicates_removed']}
• New jobs added: {self.stats['new_jobs_added']}
• New companies found: {self.stats['new_companies_found']}
• Companies enriched with OpenAI: {self.stats['companies_enriched']}

📁 Files Updated:
• Jobs: {self.jobs_csv}
• Companies: {self.companies_csv}
• Addresses: {self.addresses_csv}

✅ Processing complete!
        """
        return summary


def main():
    """Main function to demonstrate usage"""
    import argparse

    parser = argparse.ArgumentParser(description="Process LinkedIn scraped data")
    parser.add_argument("input_file", help="LinkedIn CSV or JSON file to process")
    parser.add_argument("--openai-key", help="OpenAI API key for company enrichment")
    parser.add_argument("--output-dir", help="Output directory for processed files")

    args = parser.parse_args()

    # Initialize processor
    processor = LinkedInDataProcessor(openai_api_key=args.openai_key)

    # Process data
    stats = processor.process_linkedin_data(args.input_file)

    # Save processed data
    processor.save_processed_data()

    # Print summary
    print(processor.get_processing_summary())


if __name__ == "__main__":
    main()
