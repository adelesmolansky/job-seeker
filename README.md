# AI Job Seeker

A modern, AI-powered job search platform built with Next.js, TypeScript, and Tailwind CSS. Find your next AI startup role with intelligent search, advanced filtering, and personalized recommendations.

## Features

### 🚀 AI-Powered Job Search

- **Natural Language Search**: Describe the job you want in plain English
- **OpenAI Integration**: Get intelligent job suggestions based on your description
- **Smart Recommendations**: AI analyzes your preferences to find the perfect match

### 🔍 Advanced Job Discovery

- **Comprehensive Filtering**: Filter by location, job type, experience level, salary, and more
- **Smart Sorting**: Sort by date posted, salary, job title, or company
- **Tag-based Search**: Find jobs by specific skills and technologies

### 💼 Job Management

- **Save Jobs**: Heart your favorite positions for later review
- **Detailed Job Profiles**: Comprehensive job descriptions, requirements, and benefits
- **Company Information**: Learn about company culture, benefits, and open positions

### 🏢 Company Profiles

- **Company Overview**: Detailed company information and culture
- **Open Positions**: See all available jobs at each company
- **Industry Insights**: Understand the AI startup landscape

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Integration**: OpenAI API
- **UI Components**: Headless UI
- **Utilities**: clsx for conditional classes

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd job-seeker-v1
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env.local
   ```

   Edit `.env.local` and add your OpenAI API key:

   ```env
   OPENAI_API_KEY=your_actual_api_key_here
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── companies/         # Company listing and profiles
│   ├── jobs/             # Job listing and profiles
│   ├── saved/            # Saved jobs page
│   └── page.tsx          # Home page
├── components/            # Reusable React components
│   ├── AISearch.tsx      # AI-powered search component
│   ├── JobCard.tsx       # Job display card
│   ├── JobFilters.tsx    # Advanced filtering and sorting
│   └── Navigation.tsx    # Main navigation
├── lib/                   # Utility functions and data
│   ├── mockData.ts       # Sample jobs and companies
│   └── openai.ts         # OpenAI API integration
└── types/                 # TypeScript type definitions
    └── index.ts          # Job, Company, and filter types
```

## Key Components

### AISearch

The AI-powered search component that allows users to describe their ideal job in natural language. It uses OpenAI's GPT model to understand user intent and provide relevant job suggestions.

### JobCard

A clean, informative card component that displays job information including title, company, location, salary, and key details. Users can save jobs directly from the card.

### JobFilters

Advanced filtering and sorting capabilities for jobs. Includes filters for location, job type, experience level, salary range, and remote work preferences.

### Navigation

Responsive navigation with links to home, companies, and saved jobs. Shows active states and provides easy access to all sections.

## API Integration

### OpenAI Setup

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env.local` file as `OPENAI_API_KEY` (server-side only)
3. The AI search will automatically use your key for job recommendations
4. **Security Note**: The API key is kept server-side and never exposed to the browser

### Mock Data

The application currently uses mock data for demonstration purposes. In a production environment, you would:

- Replace mock data with real API calls
- Implement proper data persistence
- Add user authentication and job saving functionality

## Customization

### Adding New Job Types

1. Update the `Job` interface in `src/types/index.ts`
2. Add new mock data in `src/lib/mockData.ts`
3. Update filtering logic in `JobFilters.tsx`

### Styling

The application uses Tailwind CSS for styling. You can:

- Modify color schemes in `tailwind.config.js`
- Add custom components in `src/components/`
- Override default styles in `src/app/globals.css`

### AI Prompts

Customize AI behavior by modifying the system prompts in `src/lib/openai.ts`:

- Adjust the AI's role and expertise
- Modify response length and format
- Add industry-specific knowledge

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Traditional VPS with Node.js

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- Create an issue in the GitHub repository
- Check the documentation in the code comments
- Review the TypeScript types for API structure

## Roadmap

- [ ] User authentication and profiles
- [ ] Job application tracking
- [ ] Email notifications for new jobs
- [ ] Advanced AI job matching
- [ ] Company review system
- [ ] Salary insights and analytics
- [ ] Mobile app (React Native)
- [ ] Integration with job boards (LinkedIn, Indeed, etc.)

---

Built with ❤️ for the AI startup community
