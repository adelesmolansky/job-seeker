'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Briefcase, Sparkles, Brain, TrendingUp } from 'lucide-react';
import JobFilters from '@/components/JobFilters';
import JobCard from '@/components/JobCard';
import { Job, JobSearchFilters, JobSearchSort } from '@/types';
import { fetchAllData } from '@/lib/dataService';
import {
  performAISearch,
  enhanceSearchResults,
  suggestRelatedSearches,
} from '@/lib/aiSearch';

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAISearch, setIsAISearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInsights, setSearchInsights] = useState<string[]>([]);
  const [relatedSearches, setRelatedSearches] = useState<string[]>([]);
  const [filters, setFilters] = useState<JobSearchFilters>({
    location: '',
    type: '',
    remote: false,
    experienceLevel: '',
    salaryMin: 0,
    salaryMax: 0,
    tags: [],
  });
  const [sort, setSort] = useState<JobSearchSort>({
    field: 'postedDate',
    direction: 'desc',
  });

  // Load CSV data on component mount
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchAllData();
      setJobs(data.jobs);
    };
    loadData();
  }, []);

  // Check if user has performed any search
  const hasSearched =
    searchQuery.trim() !== '' ||
    Object.values(filters).some(
      (value) =>
        value !== '' &&
        value !== false &&
        (Array.isArray(value) ? value.length > 0 : true)
    );

  // Handle AI search
  const handleAISearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setIsAISearch(true);

    try {
      const aiResult = await performAISearch({
        query: searchQuery,
        filters: {
          location: Array.isArray(filters.location)
            ? filters.location
            : filters.location
            ? [filters.location]
            : undefined,
          experienceLevel: filters.experienceLevel || undefined,
          remote: filters.remote || undefined,
        },
      });

      if (aiResult.jobs.length > 0) {
        setJobs(aiResult.jobs);
        const enhanced = enhanceSearchResults(
          aiResult.jobs,
          aiResult.companies,
          searchQuery
        );
        setSearchInsights(enhanced.insights);
      }

      setRelatedSearches(suggestRelatedSearches(searchQuery));
    } catch (error) {
      console.error('AI search failed:', error);
      // Fallback to regular search
      setIsAISearch(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle regular search
  const handleRegularSearch = () => {
    setIsAISearch(false);
    setSearchInsights([]);
    setRelatedSearches([]);
  };

  // Filter and sort jobs only when user has searched
  const filteredAndSortedJobs = useMemo(() => {
    if (!hasSearched) return [];

    const filtered = jobs.filter((job) => {
      // Safety check: ensure all required properties exist
      if (
        !job ||
        !job.title ||
        !job.company ||
        !job.description ||
        !job.location ||
        !job.tags
      ) {
        console.warn('Job missing required properties:', job);
        return false;
      }

      // Search query filter
      if (searchQuery && !isAISearch) {
        // Only apply strict text filtering for regular search, not AI search
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          job.title.toLowerCase().includes(query) ||
          job.company.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          job.tags.some((tag) => tag && tag.toLowerCase().includes(query));

        if (!matchesSearch) return false;
      }

      // Location filter
      if (filters.location) {
        if (Array.isArray(filters.location)) {
          // Multiple locations - check if job location matches any of them
          const jobLocationLower = job.location.toLowerCase();
          const hasMatchingLocation = filters.location.some((loc) =>
            jobLocationLower.includes(loc.toLowerCase())
          );
          if (!hasMatchingLocation) return false;
        } else {
          // Single location string
          if (
            !job.location.toLowerCase().includes(filters.location.toLowerCase())
          ) {
            return false;
          }
        }
      }

      // Job type filter
      if (filters.type && job.type !== filters.type) {
        return false;
      }

      // Remote filter
      if (filters.remote !== false && job.remote !== filters.remote) {
        return false;
      }

      // Experience level filter
      if (
        filters.experienceLevel &&
        job.experienceLevel !== filters.experienceLevel
      ) {
        return false;
      }

      // Salary filters
      if (filters.salaryMin > 0 && job.salary.min < filters.salaryMin) {
        return false;
      }
      if (filters.salaryMax > 0 && job.salary.max > filters.salaryMax) {
        return false;
      }

      // Tags filter
      if (
        filters.tags.length > 0 &&
        !filters.tags.some((tag) => job.tags.includes(tag))
      ) {
        return false;
      }

      return true;
    });

    // Sort jobs
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;

      switch (sort.field) {
        case 'postedDate':
          aValue = a.postedDate ? new Date(a.postedDate).getTime() : 0;
          bValue = b.postedDate ? new Date(b.postedDate).getTime() : 0;
          break;
        case 'salary':
          aValue = a.salary?.min || 0;
          bValue = b.salary?.min || 0;
          break;
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'company':
          aValue = a.company?.toLowerCase() || '';
          bValue = b.company?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (sort.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [jobs, searchQuery, filters, sort, hasSearched, isAISearch]);

  const handleSaveToggle = (jobId: string) => {
    // In a real app, you'd update the backend here
    console.log('Toggle save for job:', jobId);
  };

  const handleClearFilters = () => {
    setFilters({
      location: '',
      type: '',
      remote: false,
      experienceLevel: '',
      salaryMin: 0,
      salaryMax: 0,
      tags: [],
    });
    setSearchQuery('');
    setIsAISearch(false);
    setSearchInsights([]);
    setRelatedSearches([]);
  };

  const savedJobsCount = jobs.filter((job) => job.isSaved).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Next AI Startup Role
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover exciting opportunities at cutting-edge AI startups. Use our
            AI-powered search and smart filters to find the perfect match for
            your skills and career goals.
          </p>
        </div>

        {/* Search and Filters Section - Full Width */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAISearch()}
                    placeholder="Search for jobs, companies, skills, or describe what you're looking for..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAISearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Brain className="h-4 w-4" />
                  <span>{isSearching ? 'Searching...' : 'AI Search'}</span>
                </button>
                <button
                  onClick={handleRegularSearch}
                  className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Regular Search
                </button>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Briefcase className="h-4 w-4" />
                {hasSearched ? (
                  <span>{filteredAndSortedJobs.length} jobs found</span>
                ) : (
                  <span>Start searching to find jobs</span>
                )}
                {savedJobsCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600">
                      {savedJobsCount} saved
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* AI Search Insights */}
          {isAISearch && searchInsights.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <Brain className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">
                  AI Search Insights
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchInsights.map((insight, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {insight}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Search Results Header */}
          {isAISearch && filteredAndSortedJobs.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-green-900">
                    AI Found {filteredAndSortedJobs.length} Matching Jobs
                  </h3>
                </div>
                <span className="text-sm text-green-700">
                  Based on your search: &ldquo;{searchQuery}&rdquo;
                </span>
              </div>
            </div>
          )}

          {/* Related Searches */}
          {relatedSearches.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">
                Related Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedSearches.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(suggestion)}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filters and Sort - Full Width */}
          <JobFilters
            filters={filters}
            sort={sort}
            onFiltersChange={setFilters}
            onSortChange={setSort}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Results Section */}
        {!hasSearched ? (
          // Initial state - no search performed
          <div className="text-center py-16">
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="h-16 w-16 text-blue-400 mr-4" />
              <Brain className="h-16 w-16 text-blue-500 mr-4" />
              <Briefcase className="h-16 w-16 text-gray-300" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Ready to find your next AI startup role?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Use our AI-powered search to find jobs by describing what
              you&apos;re looking for in natural language, or use the smart
              filters to narrow down your search by location, job type,
              experience level, and more.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <Brain className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-gray-900">🤖 AI Search</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Describe what you want in natural language and let AI find the
                  best matches
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <Search className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-gray-900">🔍 Text Search</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Search for jobs, companies, or skills using keywords
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-gray-900">
                    ⚡ Smart Filters
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  Use dropdowns and filters to find exactly what you need
                </p>
              </div>
            </div>
          </div>
        ) : filteredAndSortedJobs.length === 0 ? (
          // Search performed but no results
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters to find more
              opportunities.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          // Results found
          <div className="space-y-6">
            {filteredAndSortedJobs.map((job) => (
              <JobCard key={job.id} job={job} onSaveToggle={handleSaveToggle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
