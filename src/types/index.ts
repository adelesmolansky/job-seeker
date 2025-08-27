export interface Job {
  id: string;
  title: string;
  company: string;
  companyId: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  remote: boolean;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: string;
  applicationDeadline?: string;
  tags: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  isSaved: boolean;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  size: string;
  founded: number;
  location: string;
  website: string;
  logo?: string;
  benefits: string[];
  culture: string;
  openPositions: number;
}

export interface JobSearchFilters {
  location: string | string[];
  type: string;
  remote: boolean;
  experienceLevel: string;
  salaryMin: number;
  salaryMax: number;
  tags: string[];
}

export interface JobSearchSort {
  field: 'postedDate' | 'salary' | 'title' | 'company';
  direction: 'asc' | 'desc';
}
