# LinkedIn Jobs Scraper

A Python-based LinkedIn jobs scraper using the [linkedin-jobs-scraper](https://pypi.org/project/linkedin-jobs-scraper/) package. This scraper can extract job postings from LinkedIn with various filtering options and save them to CSV/JSON formats.

## Features

- 🎯 **Multiple Scraping Scenarios**: Pre-configured scenarios for different job types and experience levels
- 🛡️ **Safety Levels**: Configurable rate limiting to avoid being blocked
- 📍 **Location Filtering**: Support for multiple locations including remote work
- 💰 **Salary Filtering**: Filter by salary ranges
- 🏢 **Company Filtering**: Pre-configured filters for top tech companies
- 📊 **Multiple Output Formats**: Save data as CSV or JSON
- 🔧 **Configurable**: Easy to customize search terms, filters, and settings

## Requirements

- Python 3.7 or higher
- Chrome or Chromium browser
- Internet connection

## Installation

1. **Navigate to the scraper directory:**

   ```bash
   cd scripts/linkedin-scraper
   ```

2. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Verify installation:**
   ```bash
   python test_setup.py
   ```

## Quick Start

### 1. List Available Scenarios

```bash
python run_scraper.py --list-scenarios
```

### 2. Run a Basic Scraping Scenario

```bash
python run_scraper.py --scenario ai_jobs_junior
```

### 3. Run with Custom Safety Level

```bash
python run_scraper.py --scenario ai_jobs_mid_senior --safety conservative
```

### 4. Save Output to Specific Directory

```bash
python run_scraper.py --scenario ai_jobs_senior_executive --output ./results
```

## Available Scenarios

| Scenario                   | Description                                    | Jobs per Query | Best For                 |
| -------------------------- | ---------------------------------------------- | -------------- | ------------------------ |
| `ai_jobs_junior`           | Junior AI/Tech jobs, remote-friendly           | 25             | Entry-level positions    |
| `ai_jobs_mid_senior`       | Mid to Senior AI/Tech jobs, 100k+ salary       | 50             | Mid-career professionals |
| `ai_jobs_senior_executive` | Senior to Executive AI/Tech jobs, 150k+ salary | 75             | Senior professionals     |
| `top_tech_companies`       | AI/Tech jobs at top tech companies             | 100            | Big tech companies       |
| `startup_ai_jobs`          | AI/Tech jobs at startups                       | 50             | Startup environment      |

## Safety Levels

| Level          | Slow Motion | Max Workers | Rate Limiting | Use Case                         |
| -------------- | ----------- | ----------- | ------------- | -------------------------------- |
| `conservative` | 2.0s        | 1           | High          | First time use, avoiding blocks  |
| `moderate`     | 1.0s        | 1           | Medium        | Regular use, balanced approach   |
| `aggressive`   | 0.5s        | 2           | Low           | Fast scraping, experienced users |

## Configuration

### Customizing Search Terms

Edit `config.py` to modify the `AI_TECH_JOBS` list:

```python
AI_TECH_JOBS = [
    "AI Engineer",
    "Machine Learning Engineer",
    "Data Scientist",
    # Add your custom terms here
]
```

### Customizing Filters

Modify the filter configurations in `config.py`:

```python
CUSTOM_FILTERS = {
    'relevance': RelevanceFilters.RECENT,
    'time': TimeFilters.WEEK,  # Change from MONTH to WEEK
    'type': [TypeFilters.FULL_TIME, TypeFilters.PART_TIME],
    'experience': [ExperienceLevelFilters.ENTRY_LEVEL],
    'remote': [OnSiteOrRemoteFilters.REMOTE]
}
```

### Adding Company Filters

Add company-specific URLs to `COMPANY_FILTERS`:

```python
COMPANY_FILTERS = {
    'your_company': 'https://www.linkedin.com/jobs/search/?f_C=YOUR_COMPANY_ID',
    # ... existing companies
}
```

## Output Data

The scraper extracts the following information for each job:

- **Basic Info**: Job ID, title, company, location
- **Company Details**: Company link, company image link
- **Job Details**: Description (text and HTML), date posted
- **Application**: Job link, apply link
- **Metadata**: Insights, scraped timestamp

### Sample Output Structure

```json
{
  "job_id": "123456789",
  "title": "Senior AI Engineer",
  "company": "Tech Corp",
  "company_link": "https://linkedin.com/company/techcorp",
  "place": "San Francisco, CA",
  "description": "We are looking for a Senior AI Engineer...",
  "date": "2024-01-15",
  "link": "https://linkedin.com/jobs/view/123456789",
  "apply_link": "https://linkedin.com/jobs/view/123456789/apply",
  "insights": "50 applicants",
  "scraped_at": "2024-01-15T10:30:00"
}
```

## Advanced Usage

### Custom Scraping Script

```python
from linkedin_scraper import LinkedInJobScraper
from config import MID_SENIOR_FILTERS

# Initialize scraper
scraper = LinkedInJobScraper(headless=True, slow_mo=1.0)

# Custom search
jobs = scraper.scrape_jobs(
    search_terms=["AI Engineer", "ML Engineer"],
    locations=["United States", "Remote"],
    limit=100,
    filters=MID_SENIOR_FILTERS
)

# Save results
scraper.save_to_csv("custom_jobs.csv")
scraper.save_to_json("custom_jobs.json")

# Cleanup
scraper.close()
```

### Batch Processing

```python
import time
from config import SCRAPING_SCENARIOS

scraper = LinkedInJobScraper()

for scenario_name in ['ai_jobs_junior', 'ai_jobs_mid_senior']:
    print(f"Running {scenario_name}...")

    jobs = scraper.scrape_jobs(
        **SCRAPING_SCENARIOS[scenario_name]
    )

    # Save with scenario name
    scraper.save_to_csv(f"{scenario_name}.csv")

    # Wait between scenarios
    time.sleep(5)

scraper.close()
```

## Troubleshooting

### Common Issues

1. **"Chrome not found" error**

   - Install Chrome or Chromium browser
   - Make sure it's in your system PATH

2. **"Too many requests" error**

   - Use a more conservative safety level
   - Increase `slow_mo` value
   - Reduce `max_workers`

3. **No jobs scraped**

   - Check your internet connection
   - Verify search terms are valid
   - Try different locations or filters

4. **Import errors**
   - Run `pip install -r requirements.txt`
   - Check Python version compatibility

### Debug Mode

Enable debug logging by modifying the scraper initialization:

```python
import logging
logging.basicConfig(level=logging.DEBUG)

scraper = LinkedInJobScraper()
```

## Rate Limiting & Ethics

⚠️ **Important Notes:**

- This scraper is for **personal/educational use only**
- Respect LinkedIn's terms of service
- Use conservative settings to avoid being blocked
- Don't scrape excessively or too frequently
- The data remains owned by LinkedIn

## Legal Disclaimer

This tool is meant for personal or educational use only. All data extracted is publicly available on LinkedIn and remains owned by LinkedIn. Users are responsible for complying with LinkedIn's terms of service and applicable laws.

## Support

If you encounter issues:

1. Run `python test_setup.py` to diagnose problems
2. Check the troubleshooting section above
3. Review the [linkedin-jobs-scraper documentation](https://pypi.org/project/linkedin-jobs-scraper/)

## License

This project follows the same license as the underlying `linkedin-jobs-scraper` package (MIT License).
