export interface Company {
  id: string;
  name: string;
  industry: string;
  focus: string;
  details: string;
  size: number | null;
  stage: string | null;
  funding: string | null;
  founded_year: number | null;
  headquarters: string;
  website: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  company: string;
  name: string;
  overview: string;
  responsibilities: string[];
  qualifications: string[];
  optional_qualifications: string[];
  location: string;
  benefits: string[];
  remote: boolean;
  created_at: string;
  updated_at: string;
  is_open: boolean;
}

export interface Address {
  id: string;
  city: string;
  state: string;
  country: string;
  street_address: string;
  created_at: string;
  updated_at: string;
}

export interface CompanySearchResult {
  name: string;
  industry: string;
  focus: string;
  website?: string;
  location?: string;
  size?: string;
  stage?: string;
  funding?: string;
  founded_year?: string;
}

export interface JobSearchResult {
  company: string;
  title: string;
  overview: string;
  location: string;
  remote?: boolean;
}

export interface CompanyDetailResult {
  name: string;
  industry: string;
  focus: string;
  details: string;
  size: number;
  stage: string;
  funding: string;
  founded_year: number;
  headquarters: string;
  website: string;
}
