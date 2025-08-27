'use client';

import Link from 'next/link';
import {
  Heart,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Wifi,
} from 'lucide-react';
import { Job } from '@/types';

interface JobCardProps {
  job: Job;
  onSaveToggle: (jobId: string) => void;
}

/**
 * Job card component displaying job information in a clean, clickable format
 */
export default function JobCard({ job, onSaveToggle }: JobCardProps) {
  const formatSalary = (min: number, max: number, currency: string) => {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
      return num.toString();
    };

    return `${currency}${formatNumber(min)} - ${currency}${formatNumber(max)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer">
      <Link href={`/jobs/${job.id}`} className="block p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
              {job.title}
            </h3>
            <p className="text-gray-600 font-medium">{job.company}</p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              onSaveToggle(job.id);
            }}
            className={`p-2 rounded-full transition-colors ${
              job.isSaved
                ? 'text-red-500 hover:text-red-600'
                : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart className={`h-5 w-5 ${job.isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{job.location}</span>
            {job.remote && (
              <>
                <span className="mx-2">•</span>
                <Wifi className="h-4 w-4 mr-1" />
                <span>Remote</span>
              </>
            )}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span className="capitalize">{job.type.replace('-', ' ')}</span>
            <span className="mx-2">•</span>
            <span>{formatDate(job.postedDate)}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="h-4 w-4 mr-2" />
            <span>
              {formatSalary(
                job.salary.min,
                job.salary.max,
                job.salary.currency
              )}
            </span>
            <span className="mx-2">•</span>
            <Briefcase className="h-4 w-4 mr-1" />
            <span className="capitalize">{job.experienceLevel}</span>
          </div>
        </div>

        <p className="text-gray-700 text-sm line-clamp-2 mb-4">
          {job.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {job.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
          {job.tags.length > 4 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{job.tags.length - 4} more
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
