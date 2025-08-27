import { Job, Company } from '@/types';

export interface AISearchQuery {
  query: string;
  filters?: {
    location?: string[];
    industry?: string[];
    experienceLevel?: string;
    remote?: boolean;
    salaryRange?: { min: number; max: number };
  };
}

export interface AISearchResult {
  jobs: Job[];
  companies: Company[];
  explanation: string;
  confidence: number;
}

/**
 * Performs AI-powered search using the existing AI search API
 */
export async function performAISearch(
  searchQuery: AISearchQuery
): Promise<AISearchResult> {
  try {
    const response = await fetch('/api/ai-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchQuery),
    });

    if (!response.ok) {
      throw new Error(`AI search failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('AI search error:', error);

    // Fallback to basic search if AI search fails
    return {
      jobs: [],
      companies: [],
      explanation:
        'AI search is temporarily unavailable. Please try a different search query.',
      confidence: 0,
    };
  }
}

/**
 * Enhances search results with AI-generated insights and suggestions
 */
export function enhanceSearchResults(
  jobs: Job[],
  companies: Company[],
  query: string
): { enhancedJobs: Job[]; enhancedCompanies: Company[]; insights: string[] } {
  const insights: string[] = [];

  // Generate insights based on search results
  if (jobs.length > 0) {
    const remoteJobs = jobs.filter((job) => job.remote);
    const onSiteJobs = jobs.filter((job) => !job.remote);

    if (remoteJobs.length > 0) {
      insights.push(`${remoteJobs.length} remote opportunities available`);
    }

    if (onSiteJobs.length > 0) {
      insights.push(`${onSiteJobs.length} on-site positions available`);
    }

    const topIndustries = getTopIndustries(jobs, companies);
    if (topIndustries.length > 0) {
      insights.push(`Top industries: ${topIndustries.slice(0, 3).join(', ')}`);
    }
  }

  // Add AI-generated insights based on query
  if (
    query.toLowerCase().includes('machine learning') ||
    query.toLowerCase().includes('ml')
  ) {
    insights.push('Machine learning roles are in high demand');
  }

  if (
    query.toLowerCase().includes('remote') ||
    query.toLowerCase().includes('work from home')
  ) {
    insights.push('Remote work options are available for many positions');
  }

  if (
    query.toLowerCase().includes('entry') ||
    query.toLowerCase().includes('junior')
  ) {
    insights.push('Entry-level positions are available for recent graduates');
  }

  return {
    enhancedJobs: jobs,
    enhancedCompanies: companies,
    insights,
  };
}

/**
 * Gets the top industries from the search results
 */
function getTopIndustries(jobs: Job[], companies: Company[]): string[] {
  const industryCount: Record<string, number> = {};

  companies.forEach((company) => {
    industryCount[company.industry] =
      (industryCount[company.industry] || 0) + 1;
  });

  return Object.entries(industryCount)
    .sort(([, a], [, b]) => b - a)
    .map(([industry]) => industry);
}

/**
 * Suggests related search terms based on the current query
 */
export function suggestRelatedSearches(query: string): string[] {
  const suggestions: string[] = [];
  const lowerQuery = query.toLowerCase();

  if (
    lowerQuery.includes('ai') ||
    lowerQuery.includes('artificial intelligence')
  ) {
    suggestions.push(
      'Machine Learning',
      'Deep Learning',
      'Computer Vision',
      'NLP'
    );
  }

  if (lowerQuery.includes('machine learning') || lowerQuery.includes('ml')) {
    suggestions.push('Deep Learning', 'AI Engineer', 'Data Scientist', 'MLOps');
  }

  if (lowerQuery.includes('remote') || lowerQuery.includes('work from home')) {
    suggestions.push('Flexible work', 'Hybrid', 'On-site opportunities');
  }

  if (lowerQuery.includes('entry') || lowerQuery.includes('junior')) {
    suggestions.push('Mid-level', 'Senior positions', 'Internships');
  }

  if (lowerQuery.includes('python') || lowerQuery.includes('programming')) {
    suggestions.push('JavaScript', 'Java', 'C++', 'Go');
  }

  return suggestions.slice(0, 4); // Limit to 4 suggestions
}
