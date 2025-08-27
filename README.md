# Job Seeker v1 - AI-Powered Job Search Platform

A modern, AI-powered job search platform for finding opportunities at cutting-edge AI startups and tech companies.

## Features

### 🤖 AI-Powered Search

- **Natural Language Search**: Describe what you're looking for in plain English
- **Smart Job Matching**: AI analyzes your query and finds the most relevant positions
- **Intelligent Insights**: Get AI-generated insights about search results
- **Related Searches**: Discover similar opportunities and related job categories

### 📊 Real Data Integration

- **CSV Data Source**: Uses real job and company data from the scripts folder
- **Dynamic Loading**: Fetches data through API endpoints for scalability
- **Data Validation**: Handles data inconsistencies gracefully with fallbacks

### 🔍 Advanced Search & Filtering

- **Multi-criteria Filters**: Filter by location, job type, experience level, remote work
- **Smart Sorting**: Sort by date, salary, title, or company
- **Location-based Search**: Find opportunities in specific cities or regions
- **Remote Work Options**: Filter for remote, hybrid, or on-site positions

### 💼 Job Management

- **Save Jobs**: Bookmark interesting opportunities for later
- **Detailed Job Cards**: Comprehensive job information with requirements and benefits
- **Company Profiles**: Learn about companies and their AI focus areas

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI GPT API
- **Data Processing**: CSV parsing with csv-parse
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd job-seeker-v1
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp env.example .env.local
```

Add your OpenAI API key to `.env.local`:

```
OPENAI_API_KEY=your_openai_api_key_here
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### `/api/csv-data`

- **GET** `/api/csv-data?type=jobs` - Fetch job data
- **GET** `/api/csv-data?type=companies` - Fetch company data

### `/api/ai-search`

- **POST** - AI-powered job search with natural language queries

## Data Structure

### Jobs CSV Format

```csv
id,company,name,overview,responsibilities,qualifications,optional_qualifications,location,benefits,remote,created_at,updated_at,is_open
```

### Companies CSV Format

```csv
id,name,industry,focus,details,size,stage,funding,founded_year,headquarters,website,created_at,updated_at
```

## Usage Examples

### AI Search Queries

- "I'm looking for remote machine learning jobs in San Francisco"
- "Entry-level AI positions for recent graduates"
- "Senior software engineer roles at AI companies"
- "Computer vision and robotics opportunities"

### Regular Search

- Use keywords like "Python", "TensorFlow", "NLP"
- Search by company name: "OpenAI", "DeepMind"
- Filter by location: "San Francisco", "London"
- Specify job type: "full-time", "internship"

## Development

### Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   ├── companies/      # Company pages
│   ├── jobs/           # Job pages
│   └── saved/          # Saved jobs page
├── components/          # React components
├── lib/                 # Utility functions
└── types/               # TypeScript type definitions
```

### Key Components

- **HomePage**: Main landing page with AI search
- **JobCard**: Individual job display component
- **JobFilters**: Advanced filtering and sorting
- **AISearch**: AI-powered search functionality
- **CSVReader**: Data fetching and parsing utilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please open an issue in the repository.
