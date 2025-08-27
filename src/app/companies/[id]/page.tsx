'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Calendar,
  Globe,
  Briefcase,
  Heart,
  ExternalLink,
} from 'lucide-react';
import { Company, Job } from '@/types';
import { mockCompanies, mockJobs } from '@/lib/mockData';

export default function CompanyProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [companyJobs, setCompanyJobs] = useState<Job[]>([]);

  useEffect(() => {
    const companyId = params.id as string;
    const foundCompany = mockCompanies.find((c) => c.id === companyId);

    if (foundCompany) {
      setCompany(foundCompany);
      // Get jobs for this company
      const jobs = mockJobs.filter((job) => job.companyId === companyId);
      setCompanyJobs(jobs);
    }
  }, [params.id]);

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Company not found
          </h2>
          <p className="text-gray-600 mb-4">
            The company you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/companies"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to companies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>

        {/* Company Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {company.name}
              </h1>
              <p className="text-xl text-gray-600 mb-4">
                {company.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Building2 className="h-4 w-4 mr-2" />
                  <span>{company.industry}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{company.location}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{company.size}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Founded {company.founded}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {company.openPositions}
                </div>
                <div className="text-sm text-gray-600">Open positions</div>
              </div>

              <Link
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                <Globe className="h-4 w-4 mr-1" />
                Visit website
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Company Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Company Culture */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Company Culture
              </h2>
              <p className="text-gray-700 leading-relaxed">{company.culture}</p>
            </div>
          </div>

          {/* Benefits */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Benefits & Perks
              </h2>
              <div className="space-y-2">
                {company.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center text-sm text-gray-700"
                  >
                    <Heart className="h-4 w-4 text-red-500 mr-2" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Open Positions
            </h2>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View all jobs →
            </Link>
          </div>

          {companyJobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No open positions at the moment.</p>
              <p className="text-sm text-gray-500 mt-1">
                Check back later for new opportunities!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {companyJobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="hover:text-blue-600"
                        >
                          {job.title}
                        </Link>
                      </h3>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{job.location}</span>
                        </div>

                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1" />
                          <span className="capitalize">
                            {job.type.replace('-', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <span className="font-medium">
                            ${job.salary.min.toLocaleString()} - $
                            {job.salary.max.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <span className="capitalize">
                            {job.experienceLevel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/jobs/${job.id}`}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      View Job
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
