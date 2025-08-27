'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Briefcase, Trash2 } from 'lucide-react';
import JobCard from '@/components/JobCard';
import { Job } from '@/types';
import { fetchSavedJobs } from '@/lib/dataService';

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSavedJobs = async () => {
      try {
        const saved = await fetchSavedJobs();
        setSavedJobs(saved);
      } catch (error) {
        console.error('Failed to load saved jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedJobs();
  }, []);

  const handleSaveToggle = (jobId: string) => {
    setSavedJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
    // In a real app, you'd update the backend here
  };

  const handleClearAll = () => {
    setSavedJobs([]);
    // In a real app, you'd update the backend here
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading saved jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-12 w-12 text-red-500 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">Saved Jobs</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Keep track of the jobs you&apos;re interested in. Click the heart
            icon to remove jobs from your saved list.
          </p>
        </div>

        {/* Actions */}
        {savedJobs.length > 0 && (
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-2 text-gray-600">
              <Briefcase className="h-5 w-5" />
              <span>
                {savedJobs.length} saved job{savedJobs.length !== 1 ? 's' : ''}
              </span>
            </div>

            <button
              onClick={handleClearAll}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear all</span>
            </button>
          </div>
        )}

        {/* Saved Jobs */}
        {savedJobs.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-20 w-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No saved jobs yet
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start exploring AI startup jobs and save the ones that interest
              you. Your saved jobs will appear here for easy access.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Briefcase className="h-5 w-5 mr-2" />
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {savedJobs.map((job) => (
              <JobCard key={job.id} job={job} onSaveToggle={handleSaveToggle} />
            ))}
          </div>
        )}

        {/* Tips */}
        {savedJobs.length > 0 && (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Pro Tips
            </h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>
                • Use the heart icon to save interesting jobs for later review
              </li>
              <li>
                • Compare saved jobs to find the best fit for your skills and
                goals
              </li>
              <li>
                • Set up job alerts to get notified about similar opportunities
              </li>
              <li>
                • Research companies before applying to understand their culture
                and values
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
