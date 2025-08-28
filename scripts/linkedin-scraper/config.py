"""
Configuration file for LinkedIn scraper
Contains different scraping scenarios and settings
"""

from linkedin_jobs_scraper.filters import (
    RelevanceFilters,
    TimeFilters,
    TypeFilters,
    ExperienceLevelFilters,
    OnSiteOrRemoteFilters,
    SalaryBaseFilters,
)

# Default scraper settings
DEFAULT_SETTINGS = {
    "headless": True,
    "max_workers": 1,
    "slow_mo": 1.0,
    "page_load_timeout": 40,
}

# AI/Tech job search terms
AI_TECH_JOBS = [
    "AI Engineer",
    "Machine Learning Engineer",
    "Data Scientist",
    "Software Engineer",
    "Product Manager",
    "AI Research Scientist",
    "ML Engineer",
    "Data Engineer",
    "AI Product Manager",
    "Computer Vision Engineer",
    "NLP Engineer",
    "Robotics Engineer",
    "AI/ML Engineer",
    "Deep Learning Engineer",
    "AI Developer",
]

# Remote work locations
REMOTE_LOCATIONS = ["Remote", "United States", "Europe", "Canada"]

# Job filters for different experience levels
JUNIOR_FILTERS = {
    "relevance": RelevanceFilters.RECENT,
    "time": TimeFilters.MONTH,
    "type": [TypeFilters.FULL_TIME, TypeFilters.INTERNSHIP],
    "experience": [
        ExperienceLevelFilters.ENTRY_LEVEL,
        ExperienceLevelFilters.ASSOCIATE,
    ],
    "remote": [OnSiteOrRemoteFilters.REMOTE, OnSiteOrRemoteFilters.HYBRID],
}

MID_SENIOR_FILTERS = {
    "relevance": RelevanceFilters.RECENT,
    "time": TimeFilters.MONTH,
    "type": [TypeFilters.FULL_TIME],
    "experience": [ExperienceLevelFilters.MID_SENIOR, ExperienceLevelFilters.DIRECTOR],
    "remote": [OnSiteOrRemoteFilters.REMOTE, OnSiteOrRemoteFilters.HYBRID],
    "salary": SalaryBaseFilters.SALARY_100K,
}

SENIOR_EXECUTIVE_FILTERS = {
    "relevance": RelevanceFilters.RECENT,
    "time": TimeFilters.MONTH,
    "type": [TypeFilters.FULL_TIME],
    "experience": [ExperienceLevelFilters.DIRECTOR, ExperienceLevelFilters.EXECUTIVE],
    "remote": [OnSiteOrRemoteFilters.REMOTE, OnSiteOrRemoteFilters.HYBRID],
    "salary": SalaryBaseFilters.SALARY_160K,
}

# Company-specific filters (you can add company URLs here)
COMPANY_FILTERS = {
    "google": "https://www.linkedin.com/jobs/search/?f_C=1441",
    "microsoft": "https://www.linkedin.com/jobs/search/?f_C=1035",
    "amazon": "https://www.linkedin.com/jobs/search/?f_C=165158",
    "meta": "https://www.linkedin.com/jobs/search/?f_C=10667",
    "apple": "https://www.linkedin.com/jobs/search/?f_C=162479",
    "openai": "https://www.linkedin.com/jobs/search/?f_C=18950635",
    "anthropic": "https://www.linkedin.com/jobs/search/?f_C=17876832",
    "nvidia": "https://www.linkedin.com/jobs/search/?f_C=791962",
    "tesla": "https://www.linkedin.com/jobs/search/?f_C=2374003",
    "spacex": "https://www.linkedin.com/jobs/search/?f_C=16140",
    "palantir": "https://www.linkedin.com/jobs/search/?f_C=10440912",
}

# Scraping scenarios
SCRAPING_SCENARIOS = {
    "ai_jobs_junior": {
        "search_terms": AI_TECH_JOBS[:5],  # First 5 terms
        "locations": REMOTE_LOCATIONS[:2],  # Remote + US
        "limit": 25,
        "filters": JUNIOR_FILTERS,
        "description": "Junior AI/Tech jobs, remote-friendly",
    },
    "ai_jobs_mid_senior": {
        "search_terms": AI_TECH_JOBS[:8],  # First 8 terms
        "locations": REMOTE_LOCATIONS,
        "limit": 50,
        "filters": MID_SENIOR_FILTERS,
        "description": "Mid to Senior AI/Tech jobs, remote-friendly, 100k+ salary",
    },
    "ai_jobs_senior_executive": {
        "search_terms": AI_TECH_JOBS[:10],  # First 10 terms
        "locations": REMOTE_LOCATIONS,
        "limit": 75,
        "filters": SENIOR_EXECUTIVE_FILTERS,
        "description": "Senior to Executive AI/Tech jobs, remote-friendly, 150k+ salary",
    },
    "top_tech_companies": {
        "search_terms": AI_TECH_JOBS[:5],
        "locations": REMOTE_LOCATIONS[:2],
        "limit": 100,
        "filters": MID_SENIOR_FILTERS,
        "description": "AI/Tech jobs at top tech companies",
    },
    "startup_ai_jobs": {
        "search_terms": AI_TECH_JOBS[:6],
        "locations": REMOTE_LOCATIONS[:2],
        "limit": 50,
        "filters": JUNIOR_FILTERS,
        "description": "AI/Tech jobs at startups and smaller companies",
    },
}

# Rate limiting and safety settings
SAFETY_SETTINGS = {
    "conservative": {
        "slow_mo": 2.0,
        "max_workers": 1,
        "limit_per_query": 25,
        "delay_between_queries": 5,
    },
    "moderate": {
        "slow_mo": 1.0,
        "max_workers": 1,
        "limit_per_query": 50,
        "delay_between_queries": 3,
    },
    "aggressive": {
        "slow_mo": 0.5,
        "max_workers": 2,
        "limit_per_query": 100,
        "delay_between_queries": 1,
    },
}
