# Job Seeker Data Collection Scripts

This directory contains three scripts that use OpenAI's deep research capabilities to gather data for your job seeker application. The scripts collect information about AI companies, job postings, and detailed company information, then save the data to CSV files that can be imported into a Supabase backend.

## Prerequisites

1. **OpenAI API Key**: Make sure you have your OpenAI API key in your `.env.local` file:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. **Node.js**: Ensure you have Node.js installed (version 16 or higher)

## Installation

1. Navigate to the scripts directory:

   ```bash
   cd scripts
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Scripts Overview

### 1. Find AI Companies (`find-ai-companies.ts`)

- **Purpose**: Discovers AI companies across different industries
- **Output**: `data/companies.csv` - Basic company information
- **Data**: Company name, industry, focus area, website, location
- **Usage**: `npm run find-companies`

### 2. Find Job Postings (`find-job-postings.ts`)

- **Purpose**: Searches for job postings at the discovered companies
- **Output**: `data/jobs.csv` - Job listings with detailed information
- **Data**: Job title, description, requirements, benefits, location, remote status
- **Usage**: `npm run find-jobs`

### 3. Find Company Information (`find-company-info.ts`)

- **Purpose**: Gathers detailed information about each company
- **Output**:
  - `data/companies_detailed.csv` - Enhanced company data
  - `data/addresses.csv` - Address information
- **Data**: Company size, stage, funding, founding year, detailed descriptions
- **Usage**: `npm run find-company-info`

## Running the Scripts

### Run All Scripts in Sequence

```bash
npm run run-all
```

### Run Individual Scripts

```bash
# Find AI companies first
npm run find-companies

# Then find job postings
npm run find-jobs

# Finally, gather detailed company information
npm run find-company-info
```

## Output Files

The scripts will create a `data/` directory with the following files:

### CSV Files (for Supabase import)

- `companies.csv` - Basic company information
- `companies_detailed.csv` - Enhanced company data with foreign keys
- `jobs.csv` - Job listings
- `addresses.csv` - Address information

### JSON Files (for reference)

- `company_search_results.json` - Raw company search results
- `job_search_results.json` - Raw job search results
- `company_detailed_results.json` - Detailed company information
- `address_mappings.json` - Location to address ID mappings

## Data Schema

### Companies Table

- `id` (uuid) - Primary key
- `name` (text) - Company name
- `industry` (text) - Industry/sector
- `focus` (text) - AI focus area
- `details` (text) - Detailed description
- `size` (number) - Number of employees
- `stage` (text) - Company stage (Startup, Growth, Established, Enterprise)
- `funding` (text) - Funding status
- `founded_year` (number) - Year founded
- `headquarters` (uuid) - Foreign key to addresses table
- `website` (text) - Company website
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

### Jobs Table

- `id` (uuid) - Primary key
- `company` (text) - Company name (will be mapped to company ID)
- `name` (text) - Job title
- `overview` (text) - Job description
- `responsibilities` (text[]) - Array of responsibilities
- `qualifications` (text[]) - Required qualifications
- `optional_qualifications` (text[]) - Optional qualifications
- `location` (uuid) - Foreign key to addresses table
- `benefits` (text[]) - Array of benefits
- `remote` (boolean) - Remote work availability
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp
- `is_open` (boolean) - Job posting status

### Addresses Table

- `id` (uuid) - Primary key
- `city` (text) - City name
- `state` (text) - State/province
- `country` (text) - Country
- `street_address` (text) - Street address
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

## Rate Limiting

The scripts include built-in rate limiting to avoid hitting OpenAI API limits:

- **Company search**: Processes companies individually with delays
- **Job search**: Processes companies in small batches with 2-second delays
- **Company details**: Processes companies in batches of 3 with 5-second delays

## Error Handling

Each script includes fallback data for common AI companies to ensure the process continues even if API calls fail. The scripts will:

1. Log errors to the console
2. Use fallback data when available
3. Continue processing remaining items
4. Save both successful and fallback results

## Next Steps

After running the scripts:

1. **Review the data**: Check the generated CSV files for accuracy
2. **Import to Supabase**: Use the CSV files to populate your database tables
3. **Update foreign keys**: Map company names to company IDs in the jobs table
4. **Validate relationships**: Ensure all foreign key relationships are correct

## Troubleshooting

### Common Issues

1. **OpenAI API errors**: Check your API key and billing status
2. **Rate limiting**: Increase delays between API calls if needed
3. **CSV parsing errors**: Ensure the data directory exists and has write permissions
4. **Memory issues**: Process smaller batches if dealing with large datasets

### Getting Help

If you encounter issues:

1. Check the console output for error messages
2. Verify your OpenAI API key is valid
3. Ensure all dependencies are installed correctly
4. Check that the data directory is writable
