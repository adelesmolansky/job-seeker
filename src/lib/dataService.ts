import { Job, Company } from '@/types';

interface CSVJobRecord {
  id: string;
  name: string;
  company: string;
  location: string;
  remote: string;
  overview: string;
  qualifications: string;
  benefits: string;
  created_at: string;
}

interface CSVCompanyRecord {
  id: string;
  name: string;
  industry: string;
  headquarters: string;
  details: string;
  focus: string;
  size: string;
  founded_year: string;
  website: string;
}

/**
 * Fetches all jobs and companies data from the CSV API endpoints
 */
export async function fetchAllData(): Promise<{
  jobs: Job[];
  companies: Company[];
}> {
  try {
    console.log('Fetching all data...');
    const [jobsResponse, companiesResponse] = await Promise.all([
      fetch('/api/csv-data?type=jobs'),
      fetch('/api/csv-data?type=companies'),
    ]);

    if (!jobsResponse.ok || !companiesResponse.ok) {
      throw new Error('Failed to fetch data from CSV endpoints');
    }

    const jobsData = await jobsResponse.json();
    const companiesData = await companiesResponse.json();

    console.log('Jobs data received:', jobsData.data?.length || 0, 'jobs');
    console.log(
      'Companies data received:',
      companiesData.data?.length || 0,
      'companies'
    );

    // Transform CSV data to match our interfaces
    const jobs: Job[] = (jobsData.data || []).map((record: unknown) => {
      const csvJob = record as CSVJobRecord;

      // Ensure all required fields have fallback values
      const job: Job = {
        id: csvJob.id || '',
        title: csvJob.name || 'Untitled Position',
        company: csvJob.company || 'Unknown Company',
        location:
          csvJob.location &&
          csvJob.location.length === 36 &&
          csvJob.location.includes('-')
            ? 'San Francisco, CA'
            : csvJob.location || 'Remote',
        remote: csvJob.remote === 'true' || csvJob.remote === 'True',
        description: csvJob.overview || 'No description available',
        tags: ['AI/ML', 'Technology'],
        requirements: csvJob.qualifications
          ? csvJob.qualifications
              .split(',')
              .map((q: string) => q.trim())
              .filter(Boolean)
          : ['Experience in AI/ML field'],
        benefits: csvJob.benefits
          ? csvJob.benefits
              .split(',')
              .map((b: string) => b.trim())
              .filter(Boolean)
          : ['Competitive salary', 'Health insurance'],
        postedDate: csvJob.created_at || new Date().toISOString(),
        type: 'full-time',
        experienceLevel: 'mid',
        salary: { min: 80000, max: 200000, currency: 'USD' },
        companyId: csvJob.id || '',
        isSaved: false,
      };

      return job;
    });

    const companies: Company[] = (companiesData.data || []).map(
      (record: unknown) => {
        const csvCompany = record as CSVCompanyRecord;
        return {
          id: csvCompany.id,
          name: csvCompany.name,
          industry: csvCompany.industry,
          location: csvCompany.headquarters,
          description: csvCompany.details,
          focus: csvCompany.focus,
          size: csvCompany.size,
          founded: parseInt(csvCompany.founded_year) || 2020,
          website: csvCompany.website,
          benefits: [],
          culture: `AI company focused on ${csvCompany.focus} in the ${csvCompany.industry} industry.`,
          openPositions: 0,
        };
      }
    );

    console.log('Companies transformed:', companies.length, 'companies');
    console.log('Sample company:', companies[0]);

    // Calculate open positions for each company based on actual jobs
    console.log('Calculating open positions...');
    console.log('Total jobs:', jobs.length);
    console.log('Total companies:', companies.length);

    companies.forEach((company) => {
      const companyJobs = jobs.filter((job) => job.company === company.name);
      company.openPositions = companyJobs.length;
      console.log(
        `Company: ${company.name} - Open positions: ${company.openPositions}`
      );

      // Debug: show job titles for companies with positions
      if (companyJobs.length > 0) {
        console.log(
          `  Jobs: ${companyJobs.map((job) => job.title).join(', ')}`
        );
      }
    });

    console.log(
      'Data transformation complete. Returning:',
      jobs.length,
      'jobs and',
      companies.length,
      'companies'
    );
    return { jobs, companies };
  } catch (error) {
    console.error('Error fetching all data:', error);
    return { jobs: [], companies: [] };
  }
}

/**
 * Fetches a specific company by ID
 */
export async function fetchCompanyById(
  companyId: string
): Promise<Company | null> {
  try {
    const { companies, jobs } = await fetchAllData();
    const company = companies.find((company) => company.id === companyId);

    if (company) {
      // Ensure openPositions is calculated correctly
      const companyJobs = jobs.filter((job) => job.company === company.name);
      company.openPositions = companyJobs.length;
      console.log(
        `Company ${company.name} has ${company.openPositions} open positions`
      );
    }

    return company || null;
  } catch (error) {
    console.error('Error fetching company:', error);
    return null;
  }
}

/**
 * Fetches a specific job by ID
 */
export async function fetchJobById(jobId: string): Promise<Job | null> {
  try {
    const { jobs } = await fetchAllData();
    return jobs.find((job) => job.id === jobId) || null;
  } catch (error) {
    console.error('Error fetching job:', error);
    return null;
  }
}

/**
 * Fetches jobs for a specific company
 */
export async function fetchJobsByCompany(companyId: string): Promise<Job[]> {
  try {
    const { companies, jobs } = await fetchAllData();
    const company = companies.find((company) => company.id === companyId);

    if (company) {
      const companyJobs = jobs.filter((job) => job.company === company.name);
      console.log(
        `Found ${companyJobs.length} jobs for company ${company.name}`
      );
      return companyJobs;
    }

    return [];
  } catch (error) {
    console.error('Error fetching company jobs:', error);
    return [];
  }
}

/**
 * Fetches saved jobs (jobs with isSaved: true)
 */
export async function fetchSavedJobs(): Promise<Job[]> {
  try {
    const { jobs } = await fetchAllData();
    return jobs.filter((job) => job.isSaved);
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    return [];
  }
}
