'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Wifi,
  Calendar,
  Heart,
  Building2,
  CheckCircle,
} from 'lucide-react';
import { Job, Company } from '@/types';
import { fetchJobById, fetchCompanyById } from '@/lib/dataService';

export default function JobProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadJobData = async () => {
      try {
        const jobId = params.id as string;
        const jobData = await fetchJobById(jobId);

        if (jobData) {
          setJob(jobData);
          setIsSaved(jobData.isSaved);

          // Get company info
          const companyData = await fetchCompanyById(jobData.companyId);
          setCompany(companyData);
        }
      } catch (error) {
        console.error('Failed to load job data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadJobData();
  }, [params.id]);

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
    // In a real app, you'd update the backend here
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Job not found
          </h2>
          <p className="text-gray-600 mb-4">
            The job you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to jobs
          </button>
        </div>

        {/* Job Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {job.title}
                </h1>
                <button
                  onClick={handleSaveToggle}
                  className={`p-2 rounded-full transition-colors ${
                    isSaved
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart
                    className={`h-6 w-6 ${isSaved ? 'fill-current' : ''}`}
                  />
                </button>
              </div>

              <div className="flex items-center text-xl text-gray-600 mb-4">
                <Building2 className="h-5 w-5 mr-2" />
                <Link
                  href={`/companies/${job.companyId}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {job.company}
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <span className="capitalize">
                    {job.type.replace('-', ' ')}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span className="font-medium">
                    ${job.salary.min.toLocaleString()} - $
                    {job.salary.max.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Briefcase className="h-4 w-4 mr-2" />
                  <span className="capitalize">{job.experienceLevel}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Posted {formatDate(job.postedDate)}</span>
              {job.applicationDeadline && (
                <>
                  <span className="mx-2">•</span>
                  <span>Apply by {formatDate(job.applicationDeadline)}</span>
                </>
              )}
            </div>

            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
              Apply Now
            </button>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Job Description
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Requirements
              </h2>
              <ul className="space-y-2">
                {job.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Benefits & Perks
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {job.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <Heart className="h-4 w-4 text-red-500 mr-2" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Company Info */}
            {company && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  About {company.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {company.description}
                </p>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    <span>{company.industry}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{company.location}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium">
                      {company.openPositions} open positions
                    </span>
                  </div>
                </div>

                <Link
                  href={`/companies/${company.id}`}
                  className="mt-4 block w-full text-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  View Company Profile
                </Link>
              </div>
            )}

            {/* Job Tags */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
                  Apply Now
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium">
                  Save Job
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium">
                  Share Job
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
