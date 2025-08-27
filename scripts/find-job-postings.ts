import { Job, JobSearchResult } from './util/types';
import {
  generateId,
  getCurrentTimestamp,
  writeJobsToCsv,
  ensureDataDirectory,
} from './util/utils';
import { getOpenAIClient, validateApiKey } from './util/openai-client';
import { extractAndParseJson, createJsonPrompt } from './util/json-utils';
import {
  logError,
  logSuccess,
  logInfo,
  handleCompanyError,
} from './util/error-handling';
import * as path from 'path';
import * as fs from 'fs';

async function findJobPostings(
  companyName: string
): Promise<JobSearchResult[]> {
  logInfo('Searching for job postings', `at ${companyName}...`);

  try {
    const prompt = createJsonPrompt(
      'You are a job research assistant. Find real job postings and provide detailed information about each position. Always respond with valid JSON only.',
      `Please research and find 5-10 current job postings at ${companyName}. For each job, provide:
      - Job title
      - Company name
      - Job overview/description
      - Location (city, state/country)
      - Whether it's remote or not
      
      Focus on AI, machine learning, software engineering, and related technical roles.
      
      IMPORTANT: Respond with ONLY a valid JSON array, no other text. Use this exact structure:
      [
        {
          "company": "${companyName}",
          "title": "Job Title",
          "overview": "Job description and overview",
          "location": "City, State/Country",
          "remote": true
        }
      ]`
    );

    const completion = await getOpenAIClient().chat.completions.create(prompt);
    const content = completion.choices[0]?.message?.content;

    const companies: JobSearchResult[] = extractAndParseJson<JobSearchResult[]>(
      content!,
      'array',
      `job postings for ${companyName}`
    );

    logSuccess(
      'Job search',
      `Found ${companies.length} job postings for ${companyName}`
    );
    return companies;
  } catch (error) {
    logError(`job postings for ${companyName}`, error);
    throw error;
  }
}

async function main() {
  try {
    validateApiKey();
    ensureDataDirectory();

    // Read companies from the companies CSV
    const companiesPath = path.join(process.cwd(), 'csv', 'companies.csv');
    if (!fs.existsSync(companiesPath)) {
      logError(
        'Setup',
        'Companies CSV not found. Please run find-ai-companies.ts first.'
      );
      process.exit(1);
    }

    // For now, we'll use a subset of companies to avoid rate limiting
    const companies = ['OpenAI', 'DeepMind', 'NVIDIA', 'C3.ai', 'Palantir'];

    const allJobs: Job[] = [];
    const allAddresses = new Map<string, string>(); // location -> address_id

    for (const companyName of companies) {
      logInfo('Processing company', companyName);

      try {
        const jobs = await findJobPostings(companyName);

        // Convert to Job format
        const formattedJobs: Job[] = jobs.map((job) => {
          const location = job.location;
          let addressId = allAddresses.get(location);

          if (!addressId) {
            addressId = generateId();
            allAddresses.set(location, addressId);
          }

          return {
            id: generateId(),
            company: companyName, // We'll need to map this to company ID later
            name: job.title,
            overview: job.overview,
            responsibilities: [
              'Develop and implement AI/ML models',
              'Collaborate with cross-functional teams',
              'Stay up-to-date with latest AI research',
              'Optimize model performance and scalability',
            ],
            qualifications: [
              "Bachelor's degree in Computer Science or related field",
              'Experience with Python, TensorFlow, PyTorch',
              'Strong understanding of machine learning algorithms',
              'Experience with large-scale data processing',
            ],
            optional_qualifications: [
              "Master's or PhD in AI/ML",
              'Experience with cloud platforms (AWS, GCP, Azure)',
              'Publications in top AI conferences',
              'Experience with MLOps and model deployment',
            ],
            location: addressId,
            benefits: [
              'Competitive salary and equity',
              'Health, dental, and vision insurance',
              'Flexible work arrangements',
              'Professional development opportunities',
              '401(k) matching',
            ],
            remote: job.remote || false,
            created_at: getCurrentTimestamp(),
            updated_at: getCurrentTimestamp(),
            is_open: true,
          };
        });

        allJobs.push(...formattedJobs);
        logSuccess(
          'Company processing',
          `Successfully processed ${formattedJobs.length} jobs for ${companyName}`
        );
      } catch (error) {
        handleCompanyError(companyName, error);
        // Continue with next company instead of stopping the entire process
        continue;
      }

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    if (allJobs.length === 0) {
      throw new Error('No jobs were successfully processed');
    }

    // Write jobs to CSV
    await writeJobsToCsv(allJobs);
    logSuccess('Data export', `Saved ${allJobs.length} jobs to csv/jobs.csv`);
  } catch (error) {
    logError('main function', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
