// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import { parse as parseCsv } from 'csv-parse/sync';

interface CSVJobRecord {
  id: string;
  company: string;
  name: string;
  overview: string;
  responsibilities: string;
  qualifications: string;
  optional_qualifications: string;
  location: string; // This is now a foreign key to addresses
  benefits: string;
  remote: string;
  created_at: string;
  updated_at: string;
  is_open: string;
}

interface CSVAddressRecord {
  id: string;
  city: string;
  state: string;
  country: string;
  street_address: string;
  created_at: string;
  updated_at: string;
}

interface CSVCompanyRecord {
  id: string;
  name: string;
  industry: string;
  focus: string;
  details: string;
  size: string;
  stage: string;
  funding: string;
  founded_year: string;
  headquarters: string;
  website: string;
  created_at: string;
  updated_at: string;
}

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  overview: string;
  qualifications: string[];
  benefits: string[];
  createdAtISO: string;
  vector?: number[];
};

type Cache = {
  jobs: Job[];
  companies: CSVCompanyRecord[];
  addresses: CSVAddressRecord[];
};

declare global {
  var __JOB_CACHE__: Cache | undefined;
}

// Ensure the global cache is properly typed
globalThis.__JOB_CACHE__ = globalThis.__JOB_CACHE__ || undefined;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const JOBS_CSV = path.join(process.cwd(), 'scripts', 'csv', 'jobs.csv');
const COMPANIES_CSV = path.join(
  process.cwd(),
  'scripts',
  'csv',
  'companies.csv'
);
const ADDRESSES_CSV = path.join(
  process.cwd(),
  'scripts',
  'csv',
  'addresses.csv'
);

// ----------------- utils -----------------
function splitList(s?: string): string[] {
  if (!s) return [];
  return s
    .split(/[,;]\s*/)
    .map((t) => t.trim())
    .filter(Boolean);
}
function safeISO(d?: string) {
  return d && !Number.isNaN(Date.parse(d))
    ? new Date(d).toISOString()
    : new Date().toISOString();
}

function resolveLocation(
  locationId: string,
  addresses: CSVAddressRecord[]
): string {
  const address = addresses.find((addr) => addr.id === locationId);
  if (!address) return 'Remote';

  const parts = [address.city, address.state, address.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Remote';
}
function cosine(a: number[], b: number[]) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

// ----------------- data cache -----------------
async function loadCsvs(): Promise<Cache> {
  try {
    const [jobsContent, companiesContent, addressesContent] = await Promise.all(
      [
        fs.readFile(JOBS_CSV, 'utf-8'),
        fs.readFile(COMPANIES_CSV, 'utf-8'),
        fs.readFile(ADDRESSES_CSV, 'utf-8'),
      ]
    );

    const jobsRecords = parseCsv(jobsContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CSVJobRecord[];
    const companiesRecords = parseCsv(companiesContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CSVCompanyRecord[];
    const addressesRecords = parseCsv(addressesContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CSVAddressRecord[];

    console.log(
      `Parsed ${jobsRecords.length} jobs, ${companiesRecords.length} companies, ${addressesRecords.length} addresses`
    );

    // Validate that addresses were parsed correctly
    if (addressesRecords.length === 0) {
      console.error('No addresses parsed from CSV!');
      console.error(
        'Addresses CSV content preview:',
        addressesContent.substring(0, 200)
      );
    } else {
      console.log('Sample address record:', addressesRecords[0]);
    }

    const jobs: Job[] = jobsRecords.map((j) => ({
      id: j.id,
      title: j.name?.trim() || 'Untitled Position',
      company: j.company?.trim() || 'Unknown Company',
      location: resolveLocation(j.location, addressesRecords),
      remote: j.remote?.toLowerCase() === 'true',
      overview: j.overview || '',
      qualifications: splitList(j.qualifications),
      benefits: splitList(j.benefits),
      createdAtISO: safeISO(j.created_at),
    }));

    return { jobs, companies: companiesRecords, addresses: addressesRecords };
  } catch (error) {
    console.error('Error loading CSVs:', error);
    throw new Error(`Failed to load CSV data: ${error}`);
  }
}

async function ensureCache() {
  console.log(
    'ensureCache called, global cache exists:',
    !!globalThis.__JOB_CACHE__
  );

  // Check if existing cache is valid (has all required fields)
  if (
    globalThis.__JOB_CACHE__ &&
    globalThis.__JOB_CACHE__.jobs &&
    globalThis.__JOB_CACHE__.companies &&
    globalThis.__JOB_CACHE__.addresses
  ) {
    console.log('Using existing valid cache');
  } else {
    console.log('Loading CSVs (invalid or missing cache)...');
    globalThis.__JOB_CACHE__ = await loadCsvs();
    console.log('CSVs loaded, cache created');
  }

  const cache = globalThis.__JOB_CACHE__!;
  console.log('Cache structure:', {
    jobs: cache.jobs?.length || 'undefined',
    companies: cache.companies?.length || 'undefined',
    addresses: cache.addresses?.length || 'undefined',
  });

  // Validate cache structure
  if (!cache.jobs || !cache.companies || !cache.addresses) {
    console.error('Invalid cache structure detected, reloading...');
    globalThis.__JOB_CACHE__ = undefined; // Clear invalid cache
    return await ensureCache(); // Recursive call to reload
  }

  return cache;
}

// Function to clear cache (useful for debugging)
function clearCache() {
  globalThis.__JOB_CACHE__ = undefined;
  console.log('Cache cleared');
}

// ----------------- embeddings -----------------
async function embedJobs(cache: Cache) {
  const jobsToEmbed = cache.jobs.filter((j) => !j.vector);
  if (jobsToEmbed.length === 0) return;

  const inputs = jobsToEmbed.map(
    (j) =>
      `${j.title} at ${j.company}. ${
        j.overview
      }. Qualifications: ${j.qualifications.join(', ')}`
  );

  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: inputs,
  });

  res.data.forEach((d, idx) => {
    jobsToEmbed[idx].vector = d.embedding as number[];
  });
}

// ----------------- routes -----------------
export async function GET(req: NextRequest) {
  // Debug endpoint to clear cache
  const { searchParams } = new URL(req.url);
  if (searchParams.get('action') === 'clear-cache') {
    clearCache();
    return NextResponse.json({ message: 'Cache cleared' });
  }
  return NextResponse.json({ message: 'Use POST for AI search' });
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    let cache: Cache;
    try {
      cache = await ensureCache();
      console.log(
        `Loaded ${cache.jobs.length} jobs, ${cache.companies.length} companies, and ${cache.addresses.length} addresses`
      );
    } catch (cacheError) {
      console.error('Failed to load cache:', cacheError);
      return NextResponse.json(
        { error: 'Failed to load job data', details: String(cacheError) },
        { status: 500 }
      );
    }

    await embedJobs(cache);
    console.log('Job embeddings completed');

    const qEmb = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const qVec = qEmb.data[0].embedding as number[];

    const scored = cache.jobs.map((j) => ({
      job: j,
      score: j.vector ? cosine(qVec, j.vector) : 0,
    }));

    scored.sort((a, b) => b.score - a.score);

    // Adaptive similarity thresholding based on query specificity
    let similarityThreshold = 0.1; // Base threshold

    // For broad queries like "engineering", use a lower threshold
    if (
      query.toLowerCase().includes('engineer') ||
      query.toLowerCase().includes('engineering')
    ) {
      similarityThreshold = 0.05;
    }

    // For specific technical queries, use a higher threshold for precision
    if (
      query.toLowerCase().includes('python') ||
      query.toLowerCase().includes('machine learning')
    ) {
      similarityThreshold = 0.15;
    }

    // Detect various query types for better filtering
    const queryLower = query.toLowerCase();

    // Location detection - more flexible patterns
    const hasLocation = queryLower.match(
      /\b(in|at|near|around|from)\s+([a-z\s,]+)/i
    );

    // Company stage/size detection
    const hasCompanyStage = queryLower.match(
      /\b(startup|established|growth|small|large|enterprise)\b/i
    );
    const hasFundingStage = queryLower.match(
      /\b(seed|series\s+[abc]|bootstrapped|public|ipo)\b/i
    );
    const hasCompanySize = queryLower.match(
      /\b(small|medium|large|tiny|big)\b/i
    );

    // Adjust similarity threshold based on query specificity
    if (hasLocation || hasCompanyStage || hasFundingStage || hasCompanySize) {
      similarityThreshold = 0.2; // Higher threshold for specific queries
    } else if (
      queryLower.includes('engineer') ||
      queryLower.includes('engineering')
    ) {
      similarityThreshold = 0.05; // Lower threshold for broad engineering queries
    } else if (
      queryLower.includes('python') ||
      queryLower.includes('machine learning')
    ) {
      similarityThreshold = 0.15; // Medium threshold for specific technical queries
    }

    // First pass: get jobs above the similarity threshold
    let relevantJobs = scored
      .filter(({ score }) => score > similarityThreshold)
      .map(({ job, score }) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        companyId: job.id, // Use job.id as companyId for now
        location: job.location,
        type: 'full-time' as const, // Default to full-time
        remote: job.remote,
        salary: { min: 80000, max: 200000, currency: 'USD' }, // Default salary range
        description: job.overview,
        requirements: job.qualifications,
        benefits: job.benefits,
        postedDate: job.createdAtISO,
        tags: ['AI/ML', 'Technology'], // Default tags
        experienceLevel: 'mid' as const, // Default to mid-level
        isSaved: false, // Default to not saved
        similarity: score, // Additional field for debugging
      }));

    // Second pass: apply comprehensive filtering based on query type
    const filterLogs: string[] = [];

    // Location filtering
    if (hasLocation) {
      const locationMatch = hasLocation[2].trim().toLowerCase();
      const locationKeywords = locationMatch.split(/[,\s]+/).filter(Boolean);

      const beforeLocation = relevantJobs.length;
      relevantJobs = relevantJobs.filter((job) => {
        const jobLocation = job.location.toLowerCase();
        return locationKeywords.some((keyword) =>
          jobLocation.includes(keyword)
        );
      });

      filterLogs.push(
        `Location: "${locationMatch}" (${beforeLocation} → ${relevantJobs.length})`
      );
    }

    // Company stage filtering
    if (hasCompanyStage || hasFundingStage || hasCompanySize) {
      const beforeCompany = relevantJobs.length;

      // Get company info for each job to apply filtering
      relevantJobs = relevantJobs.filter((job) => {
        const company = cache.companies.find((c) => c.name === job.company);
        if (!company) return true; // Keep if company not found

        // Stage filtering
        if (hasCompanyStage) {
          const stageMatch = queryLower.match(
            /\b(startup|established|growth)\b/i
          )?.[1];
          if (
            stageMatch &&
            company.stage?.toLowerCase() !== stageMatch.toLowerCase()
          ) {
            return false;
          }
        }

        // Funding filtering
        if (hasFundingStage) {
          const fundingMatch = queryLower.match(
            /\b(seed|series\s+[abc]|bootstrapped|public|ipo)\b/i
          )?.[1];
          if (fundingMatch) {
            const normalizedFunding = fundingMatch
              .toLowerCase()
              .replace(/\s+/, '');
            const normalizedCompanyFunding = company.funding
              ?.toLowerCase()
              .replace(/\s+/, '');
            if (normalizedCompanyFunding !== normalizedFunding) {
              return false;
            }
          }
        }

        // Size filtering
        if (hasCompanySize) {
          const sizeMatch = queryLower.match(
            /\b(small|medium|large|tiny|big)\b/i
          )?.[1];
          if (sizeMatch) {
            const employeeCount = parseInt(company.size) || 0;
            let isMatch = false;

            switch (sizeMatch.toLowerCase()) {
              case 'tiny':
                isMatch = employeeCount <= 50;
                break;
              case 'small':
                isMatch = employeeCount <= 200;
                break;
              case 'medium':
                isMatch = employeeCount > 200 && employeeCount <= 1000;
                break;
              case 'large':
                isMatch = employeeCount > 1000;
                break;
              case 'big':
                isMatch = employeeCount > 500;
                break;
            }

            if (!isMatch) return false;
          }
        }

        return true;
      });

      filterLogs.push(
        `Company filters: ${beforeCompany} → ${relevantJobs.length}`
      );
    }

    // Third pass: adaptive result limiting based on query specificity
    let maxResults = 50; // Default for broad queries

    if (hasLocation || hasCompanyStage || hasFundingStage || hasCompanySize) {
      maxResults = 25; // Fewer results for specific queries
    } else if (
      queryLower.includes('engineer') ||
      queryLower.includes('engineering')
    ) {
      maxResults = 75; // More results for broad engineering queries
    }

    if (relevantJobs.length > maxResults) {
      const beforeLimit = relevantJobs.length;
      relevantJobs = relevantJobs.slice(0, maxResults);
      filterLogs.push(
        `Limited to ${maxResults} results (${beforeLimit} → ${maxResults})`
      );
    }

    // Log all filtering steps
    if (filterLogs.length > 0) {
      console.log('Filtering applied:', filterLogs.join(', '));
    }

    console.log(
      `Query: "${query}" - Similarity threshold: ${similarityThreshold}`
    );
    console.log(`Total scored jobs: ${scored.length}`);
    console.log(`Jobs above threshold: ${relevantJobs.length}`);
    console.log(
      `Top 5 scores:`,
      scored
        .slice(0, 5)
        .map((s) => ({ title: s.job.title, score: s.score.toFixed(3) }))
    );

    // Find relevant companies for the matched jobs
    const matchedCompanies = cache.companies
      .filter((company) =>
        relevantJobs.some((job) => job.company === company.name)
      )
      .slice(0, 3)
      .map((company) => ({
        id: company.id,
        name: company.name,
        description: company.details || '',
        industry: company.industry || '',
        size: company.size || '',
        founded: parseInt(company.founded_year) || 2020,
        location: company.headquarters || '',
        website: company.website || '',
        benefits: [],
        culture: `AI company focused on ${
          company.focus || 'technology'
        } in the ${company.industry || 'AI/ML'} industry.`,
        openPositions: 0,
      }));

    return NextResponse.json({
      query,
      count: relevantJobs.length,
      jobs: relevantJobs,
      companies: matchedCompanies,
      explanation: `AI-powered semantic search found ${
        relevantJobs.length
      } relevant jobs for "${query}" using vector similarity${
        filterLogs.length > 0 ? ` with ${filterLogs.join(', ')}` : ''
      }.`,
      confidence: 0.9,
      fallbackUsed: false,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        error: 'Search failed',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
