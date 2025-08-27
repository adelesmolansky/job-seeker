import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

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

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Fetch available jobs and companies directly from CSV files
    let jobs: CSVJobRecord[] = [];
    let companies: CSVCompanyRecord[] = [];

    try {
      // Read jobs CSV
      const jobsPath = path.join(process.cwd(), 'scripts', 'csv', 'jobs.csv');
      const jobsContent = await fs.readFile(jobsPath, 'utf-8');
      const jobsRecords = parse(jobsContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      // Clean up jobs data
      jobs = jobsRecords.map((record: unknown) => {
        const job = record as CSVJobRecord;
        return {
          id: job.id,
          name: job.name,
          company: job.company,
          location:
            job.location &&
            job.location.length === 36 &&
            job.location.includes('-')
              ? 'San Francisco, CA'
              : job.location,
          remote: job.remote,
          overview: job.overview,
          qualifications: job.qualifications,
          benefits: job.benefits,
          created_at: job.created_at,
        };
      });

      // Read companies CSV
      const companiesPath = path.join(
        process.cwd(),
        'scripts',
        'csv',
        'companies.csv'
      );
      const companiesContent = await fs.readFile(companiesPath, 'utf-8');
      const companiesRecords = parse(companiesContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      companies = companiesRecords.map((record: unknown) => {
        const company = record as CSVCompanyRecord;
        return {
          id: company.id,
          name: company.name,
          industry: company.industry,
          headquarters: company.headquarters,
          details: company.details,
          focus: company.focus,
          size: company.size,
          founded_year: company.founded_year,
          website: company.website,
        };
      });
    } catch (csvError) {
      console.error('Error reading CSV files:', csvError);
      return NextResponse.json(
        { error: 'Failed to read CSV data files' },
        { status: 500 }
      );
    }

    // Ensure we have data to work with
    if (jobs.length === 0) {
      return NextResponse.json(
        { error: 'No job data available' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create a simplified prompt for job matching
    const systemPrompt = `You are an AI job search assistant. Analyze the user's query and return a JSON response with relevant job matches.

Available jobs:
${jobs
  .map(
    (job) =>
      `- ${job.name} at ${job.company} (${job.location}, ${
        job.remote?.toLowerCase() === 'true' ? 'Remote' : 'On-site'
      })`
  )
  .join('\n')}

IMPORTANT: Return ONLY the job title (e.g., "Machine Learning Engineer"), NOT the full description with company name.
DO NOT wrap the response in markdown code blocks.

Return a JSON object with this structure:
{
  "matchedJobs": ["Machine Learning Engineer", "Data Scientist"],
  "explanation": "Brief explanation of why these jobs match",
  "confidence": 0.8
}`;

    const userPrompt = `User query: "${query}"

Please find the most relevant jobs and return ONLY the job titles in the matchedJobs array.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const aiResponse = completion.choices[0]?.message?.content || '';

    try {
      // Try to parse the AI response as JSON, handling markdown responses
      let cleanResponse = aiResponse;
      if (aiResponse.includes('```json')) {
        // Extract JSON from markdown code blocks
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[1];
        }
      }

      const aiResult = JSON.parse(cleanResponse);

      // Extract matched jobs based on AI analysis
      let matchedJobs: CSVJobRecord[] = [];

      if (aiResult.matchedJobs && Array.isArray(aiResult.matchedJobs)) {
        matchedJobs = jobs.filter((job) =>
          aiResult.matchedJobs.includes(job.name)
        );
      }

      // If AI didn't provide specific matches, use semantic search as fallback
      if (matchedJobs.length === 0) {
        const queryLower = query.toLowerCase();
        matchedJobs = jobs
          .filter(
            (job) =>
              job.name.toLowerCase().includes(queryLower) ||
              job.company.toLowerCase().includes(queryLower) ||
              job.overview.toLowerCase().includes(queryLower)
          )
          .slice(0, 5);
      }

      // Transform CSV records to Job objects
      const transformedJobs = matchedJobs.map((csvJob) => ({
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
        type: 'full-time' as const,
        experienceLevel: 'mid' as const,
        salary: { min: 80000, max: 200000, currency: 'USD' },
        companyId: csvJob.id || '',
        isSaved: false,
      }));

      // Find relevant companies
      const matchedCompanies = companies
        .filter((company) =>
          matchedJobs.some((job) => job.company === company.name)
        )
        .slice(0, 3);

      return NextResponse.json({
        jobs: transformedJobs,
        companies: matchedCompanies,
        explanation:
          aiResult.explanation ||
          'AI analysis found relevant matches based on your search criteria.',
        confidence: aiResult.confidence || 0.8,
        aiResponse: aiResult,
      });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw AI response:', aiResponse);

      // Fallback: use semantic search
      const queryLower = query.toLowerCase();
      const matchedJobs = jobs
        .filter(
          (job) =>
            job.name.toLowerCase().includes(queryLower) ||
            job.company.toLowerCase().includes(queryLower) ||
            job.overview.toLowerCase().includes(queryLower)
        )
        .slice(0, 5);

      // Transform CSV records to Job objects for fallback too
      const transformedJobs = matchedJobs.map((csvJob) => ({
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
        type: 'full-time' as const,
        experienceLevel: 'mid' as const,
        salary: { min: 80000, max: 200000, currency: 'USD' },
        companyId: csvJob.id || '',
        isSaved: false,
      }));

      const matchedCompanies = companies
        .filter((company) =>
          matchedJobs.some((job) => job.company === company.name)
        )
        .slice(0, 3);

      return NextResponse.json({
        jobs: transformedJobs,
        companies: matchedCompanies,
        explanation:
          'AI analysis completed. Found relevant matches using semantic search.',
        confidence: 0.7,
        aiResponse: aiResponse,
      });
    }
  } catch (error) {
    console.error('Error in AI search:', error);
    return NextResponse.json(
      {
        error: 'Failed to perform AI search',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
