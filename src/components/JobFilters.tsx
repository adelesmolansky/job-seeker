'use client';

import { Filter, SortAsc, SortDesc, X, MapPin } from 'lucide-react';
import { JobSearchFilters, JobSearchSort } from '@/types';
import { useState } from 'react';

interface JobFiltersProps {
  filters: JobSearchFilters;
  sort: JobSearchSort;
  onFiltersChange: (filters: JobSearchFilters) => void;
  onSortChange: (sort: JobSearchSort) => void;
  onClearFilters: () => void;
}

/**
 * Advanced job filtering and sorting component
 */
export default function JobFilters({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  onClearFilters,
}: JobFiltersProps) {
  const [locationInput, setLocationInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');

  const handleFilterChange = (
    key: keyof JobSearchFilters,
    value: string | number | boolean | string[]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleLocationKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && locationInput.trim()) {
      e.preventDefault();
      const newLocation = locationInput.trim();
      const currentLocations = Array.isArray(filters.location)
        ? filters.location
        : [];

      if (!currentLocations.includes(newLocation)) {
        const updatedLocations = [...currentLocations, newLocation];
        handleFilterChange('location', updatedLocations);
      }

      setLocationInput('');
    }
  };

  const removeLocation = (locationToRemove: string) => {
    const currentLocations = Array.isArray(filters.location)
      ? filters.location
      : [];
    const updatedLocations = currentLocations.filter(
      (loc) => loc !== locationToRemove
    );
    handleFilterChange('location', updatedLocations);
  };

  const handleSkillsKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillsInput.trim()) {
      e.preventDefault();
      const newSkill = skillsInput.trim();
      const currentSkills = filters.tags;

      if (!currentSkills.includes(newSkill)) {
        const updatedSkills = [...currentSkills, newSkill];
        handleFilterChange('tags', updatedSkills);
      }

      setSkillsInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const updatedSkills = filters.tags.filter(
      (skill) => skill !== skillToRemove
    );
    handleFilterChange('tags', updatedSkills);
  };

  const handleSortChange = (field: JobSearchSort['field']) => {
    const direction =
      sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ field, direction });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) =>
      value !== '' &&
      value !== false &&
      (Array.isArray(value) ? value.length > 0 : true)
  );

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Clear all</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any type</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experience
            </label>
            <select
              value={filters.experienceLevel}
              onChange={(e) =>
                handleFilterChange('experienceLevel', e.target.value)
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any level</option>
              <option value="entry">Entry</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remote
            </label>
            <select
              value={filters.remote ? 'true' : 'false'}
              onChange={(e) =>
                handleFilterChange('remote', e.target.value === 'true')
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any</option>
              <option value="true">Remote only</option>
              <option value="false">On-site only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Salary
            </label>
            <input
              type="number"
              value={filters.salaryMin || ''}
              onChange={(e) =>
                handleFilterChange(
                  'salaryMin',
                  e.target.value ? Number(e.target.value) : 0
                )
              }
              placeholder="Min"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Salary
            </label>
            <input
              type="number"
              value={filters.salaryMax || ''}
              onChange={(e) =>
                handleFilterChange(
                  'salaryMax',
                  e.target.value ? Number(e.target.value) : 0
                )
              }
              placeholder="Max"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyPress={handleLocationKeyPress}
                placeholder="Type location and press Enter"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {Array.isArray(filters.location) && filters.location.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {filters.location.map((loc, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer group"
                    onClick={() => removeLocation(loc)}
                    title="Click to remove"
                  >
                    {loc}
                    <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              onKeyPress={handleSkillsKeyPress}
              placeholder="Type skill and press Enter"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {filters.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer group"
                    onClick={() => removeSkill(tag)}
                    title="Click to remove"
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sort Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <SortAsc className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Sort by</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { field: 'postedDate', label: 'Date Posted' },
            { field: 'salary', label: 'Salary' },
            { field: 'title', label: 'Job Title' },
            { field: 'company', label: 'Company' },
          ].map(({ field, label }) => (
            <button
              key={field}
              onClick={() => handleSortChange(field as JobSearchSort['field'])}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                sort.field === field
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-1">
                <span>{label}</span>
                {sort.field === field &&
                  (sort.direction === 'asc' ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
