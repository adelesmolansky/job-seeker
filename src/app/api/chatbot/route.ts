import { NextRequest, NextResponse } from 'next/server';
import { Job, Company } from '@/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  conversationHistory: ChatMessage[];
}

/**
 * API endpoint for the general chatbot functionality
 * Handles questions about jobs, companies, qualifications, and career advice
 */
export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory }: ChatRequest = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Fetch all available data for context
    const data = await fetchCSVData();
    const { jobs, companies } = data;

    // Process the user's message and generate a response
    const response = await generateChatResponse(message, conversationHistory, {
      jobs,
      companies,
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generates a contextual response based on the user's message and available data
 */
async function generateChatResponse(
  message: string,
  conversationHistory: ChatMessage[],
  data: { jobs: Job[]; companies: Company[] }
): Promise<string> {
  const lowerMessage = message.toLowerCase();
  const { jobs, companies } = data;

  // Handle specific question types
  if (
    lowerMessage.includes('qualified') ||
    lowerMessage.includes('qualification')
  ) {
    return await handleQualificationQuestion(message, jobs, companies);
  }

  if (
    lowerMessage.includes('compare') ||
    lowerMessage.includes('vs') ||
    lowerMessage.includes('versus')
  ) {
    return await handleComparisonQuestion(message, jobs, companies);
  }

  if (
    lowerMessage.includes('best jobs') ||
    lowerMessage.includes('recommend') ||
    lowerMessage.includes('palo alto')
  ) {
    return handleJobRecommendationQuestion(message, jobs, companies);
  }

  if (
    lowerMessage.includes('salary') ||
    lowerMessage.includes('pay') ||
    lowerMessage.includes('compensation')
  ) {
    return handleSalaryQuestion(message, jobs, companies);
  }

  if (
    lowerMessage.includes('remote') ||
    lowerMessage.includes('work from home')
  ) {
    return handleRemoteWorkQuestion(message, jobs, companies);
  }

  if (
    lowerMessage.includes('skills') ||
    lowerMessage.includes('requirements') ||
    lowerMessage.includes('experience')
  ) {
    return handleSkillsQuestion(message, jobs, companies);
  }

  // Default response for general questions
  return generateGeneralResponse(message, jobs, companies);
}

async function handleQualificationQuestion(
  message: string,
  jobs: Job[],
  companies: Company[]
): Promise<string> {
  const lowerMessage = message.toLowerCase();

  // Extract company name if mentioned
  const companyMatch = companies.find((company) =>
    lowerMessage.includes(company.name.toLowerCase())
  );

  if (companyMatch) {
    const companyJobs = jobs.filter(
      (job) =>
        job.companyId === companyMatch.id ||
        job.company?.toLowerCase().includes(companyMatch.name.toLowerCase())
    );

    if (companyJobs.length > 0) {
      const experienceLevels = [
        ...new Set(
          companyJobs.map((job) => job.experienceLevel).filter(Boolean)
        ),
      ];
      const commonSkills = extractCommonSkills(companyJobs);

      return (
        `For jobs at ${companyMatch.name}, here's what I found:\n\n` +
        `• Experience levels: ${
          experienceLevels.length > 0
            ? experienceLevels.join(', ')
            : 'Various levels'
        }\n` +
        `• Common skills: ${commonSkills.slice(0, 5).join(', ')}\n` +
        `• Total openings: ${companyJobs.length}\n\n` +
        `To assess your qualifications, compare your experience and skills with these requirements. ` +
        `Would you like me to analyze specific job postings or help you identify skill gaps?`
      );
    }
  }

  // If no company found in database, use AI to provide general qualification advice
  return await generateAIQualificationAdvice(message);
}

/**
 * Uses AI to generate qualification advice when company isn't found in database
 */
async function generateAIQualificationAdvice(message: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI career advisor specializing in tech and AI companies. Provide helpful advice about job qualifications and requirements. Be specific and actionable.`,
          },
          {
            role: 'user',
            content: `I'm asking about job qualifications: ${message}. Please provide advice on what qualifications are typically needed and how to assess if I'm qualified.`,
          },
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API call failed');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return `Since I don't have specific data about that company, here's some general AI-powered advice:\n\n${aiResponse}`;
  } catch (error) {
    console.error('AI qualification advice failed:', error);

    return (
      `I can help you assess your qualifications for specific companies or roles. ` +
      `Could you tell me which company or position you're interested in? ` +
      `I can then analyze the requirements and help you evaluate your fit.`
    );
  }
}

async function handleComparisonQuestion(
  message: string,
  jobs: Job[],
  companies: Company[]
): Promise<string> {
  const lowerMessage = message.toLowerCase();

  // Extract company names mentioned in the message using a more general approach
  const companyNames = extractCompanyNamesFromMessage(message);

  // Find companies that exist in our database
  const foundCompanies = companies.filter((company) =>
    companyNames.some(
      (name) =>
        company.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(company.name.toLowerCase())
    )
  );

  // If we have data for both companies, provide detailed comparison
  if (foundCompanies.length >= 2) {
    return generateDetailedComparison(foundCompanies.slice(0, 2), jobs);
  }

  // If we have data for one company, provide partial comparison
  if (foundCompanies.length === 1) {
    return generatePartialComparison(foundCompanies[0], jobs, companies);
  }

  // If no companies found in database, use AI to generate comparison
  return await generateAIComparison(companyNames, message);
}

/**
 * Extracts company names from a message using a more general approach
 */
function extractCompanyNamesFromMessage(message: string): string[] {
  // Look for patterns like "X vs Y", "X and Y", "X or Y", "compare X and Y"
  const patterns = [
    /compare\s+(.+?)\s+(?:vs|versus|and|or)\s+(.+?)(?:\s|$)/i,
    /(.+?)\s+(?:vs|versus|and|or)\s+(.+?)(?:\s|$)/i,
    /working\s+at\s+(.+?)\s+(?:vs|versus|and|or)\s+(.+?)(?:\s|$)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return [match[1].trim(), match[2].trim()];
    }
  }

  // Fallback: extract potential company names (words that look like company names)
  const words = message.split(/\s+/);
  const potentialCompanies = words.filter(
    (word) =>
      word.length > 2 &&
      /^[A-Z][a-z]+/.test(word) && // Starts with capital letter
      ![
        'the',
        'and',
        'or',
        'vs',
        'versus',
        'compare',
        'working',
        'at',
      ].includes(word.toLowerCase())
  );

  return potentialCompanies.slice(0, 2);
}

/**
 * Generates detailed comparison when both companies are found in database
 */
function generateDetailedComparison(companies: Company[], jobs: Job[]): string {
  const [company1, company2] = companies;

  const company1Jobs = jobs.filter(
    (job) =>
      job.companyId === company1.id ||
      job.company?.toLowerCase().includes(company1.name.toLowerCase())
  );

  const company2Jobs = jobs.filter(
    (job) =>
      job.companyId === company2.id ||
      job.company?.toLowerCase().includes(company2.name.toLowerCase())
  );

  return (
    `Here's a comparison of ${company1.name} vs ${company2.name}:\n\n` +
    `${company1.name}:\n` +
    `• Open positions: ${company1Jobs.length}\n` +
    `• Remote options: ${company1Jobs.filter((job) => job.remote).length}/${
      company1Jobs.length
    }\n` +
    `• Avg salary: $${calculateAverageSalary(
      company1Jobs
    ).toLocaleString()}\n\n` +
    `${company2.name}:\n` +
    `• Open positions: ${company2Jobs.length}\n` +
    `• Remote options: ${company2Jobs.filter((job) => job.remote).length}/${
      company2Jobs.length
    }\n` +
    `• Avg salary: $${calculateAverageSalary(
      company2Jobs
    ).toLocaleString()}\n\n` +
    `Both companies are leaders in AI. Consider factors like company culture, growth opportunities, ` +
    `and your specific career goals when making a decision.`
  );
}

/**
 * Generates partial comparison when only one company is found in database
 */
function generatePartialComparison(
  foundCompany: Company,
  jobs: Job[],
  allCompanies: Company[]
): string {
  const companyJobs = jobs.filter(
    (job) =>
      job.companyId === foundCompany.id ||
      job.company?.toLowerCase().includes(foundCompany.name.toLowerCase())
  );

  return (
    `I found information about ${foundCompany.name} in our database, but I couldn't find the other company you mentioned.\n\n` +
    `${foundCompany.name}:\n` +
    `• Open positions: ${companyJobs.length}\n` +
    `• Remote options: ${companyJobs.filter((job) => job.remote).length}/${
      companyJobs.length
    }\n` +
    `• Avg salary: $${calculateAverageSalary(
      companyJobs
    ).toLocaleString()}\n\n` +
    `For companies not in our database, I can provide AI-generated insights. ` +
    `Try asking me to compare ${foundCompany.name} with any other company, and I'll use AI to help with the comparison.`
  );
}

/**
 * Uses AI to generate comparison when companies aren't found in database
 */
async function generateAIComparison(
  companyNames: string[],
  originalMessage: string
): Promise<string> {
  try {
    // Call OpenAI API to generate comparison
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI career advisor specializing in tech companies. Provide insightful comparisons of companies for job seekers. Focus on culture, work environment, career growth, and opportunities. Be specific and actionable.`,
          },
          {
            role: 'user',
            content: `Compare working at ${companyNames.join(
              ' vs '
            )}. Focus on company culture, work environment, career growth opportunities, and what job seekers should consider when choosing between them.`,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API call failed');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return `Since I don't have detailed data about ${companyNames.join(
      ' and '
    )}, I'll use AI to provide insights:\n\n${aiResponse}`;
  } catch (error) {
    console.error('AI comparison failed:', error);

    // Fallback response
    return (
      `I don't have detailed data about ${companyNames.join(
        ' and '
      )} in our database. ` +
      `However, I can help you compare companies that we do have information about, or you can ask me specific questions about working at these companies. ` +
      `What would you like to know more about?`
    );
  }
}

function handleJobRecommendationQuestion(
  message: string,
  jobs: Job[],
  companies: Company[]
): string {
  const lowerMessage = message.toLowerCase();

  // Check if location is mentioned
  const isLocationSpecific =
    lowerMessage.includes('palo alto') ||
    lowerMessage.includes('san francisco') ||
    lowerMessage.includes('bay area') ||
    lowerMessage.includes('new york') ||
    lowerMessage.includes('seattle');

  if (isLocationSpecific) {
    const locationJobs = jobs.filter((job) => {
      const jobLocation = job.location?.toLowerCase() || '';
      return lowerMessage.includes('palo alto')
        ? jobLocation.includes('palo alto')
        : lowerMessage.includes('san francisco')
        ? jobLocation.includes('san francisco')
        : lowerMessage.includes('bay area')
        ? jobLocation.includes('bay area')
        : lowerMessage.includes('new york')
        ? jobLocation.includes('new york')
        : lowerMessage.includes('seattle')
        ? jobLocation.includes('seattle')
        : false;
    });

    if (locationJobs.length > 0) {
      const topJobs = locationJobs
        .sort((a, b) => (b.salary?.max || 0) - (a.salary?.max || 0))
        .slice(0, 5);

      return (
        `Here are some of the best jobs in ${
          lowerMessage.includes('palo alto')
            ? 'Palo Alto'
            : lowerMessage.includes('san francisco')
            ? 'San Francisco'
            : lowerMessage.includes('bay area')
            ? 'the Bay Area'
            : lowerMessage.includes('new york')
            ? 'New York'
            : lowerMessage.includes('seattle')
            ? 'Seattle'
            : 'this area'
        }:\n\n` +
        topJobs
          .map(
            (job) =>
              `• ${job.title} at ${job.company || 'Company'}\n` +
              `  Salary: $${job.salary?.min?.toLocaleString() || 'N/A'} - $${
                job.salary?.max?.toLocaleString() || 'N/A'
              }\n` +
              `  ${job.remote ? 'Remote' : 'On-site'} | ${
                job.experienceLevel || 'Various levels'
              }`
          )
          .join('\n\n') +
        `\n\nThese positions offer competitive salaries and are at innovative companies. ` +
        `Would you like me to provide more details about any specific role?`
      );
    }
  }

  // General job recommendations
  const topJobs = jobs
    .filter((job) => job.salary?.max && job.salary.max > 150000)
    .sort((a, b) => (b.salary?.max || 0) - (a.salary?.max || 0))
    .slice(0, 5);

  return (
    `Here are some of the best high-paying AI jobs available:\n\n` +
    topJobs
      .map(
        (job) =>
          `• ${job.title} at ${job.company || 'Company'}\n` +
          `  Location: ${job.location || 'Various'}\n` +
          `  Salary: $${job.salary?.min?.toLocaleString() || 'N/A'} - $${
            job.salary?.max?.toLocaleString() || 'N/A'
          }\n` +
          `  ${job.remote ? 'Remote' : 'On-site'} | ${
            job.experienceLevel || 'Various levels'
          }`
      )
      .join('\n\n') +
    `\n\nThese positions offer excellent compensation and growth opportunities. ` +
    `Would you like me to filter by specific criteria like location or experience level?`
  );
}

function handleSalaryQuestion(
  message: string,
  jobs: Job[],
  companies: Company[]
): string {
  const lowerMessage = message.toLowerCase();

  // Extract role/level information
  const isSenior =
    lowerMessage.includes('senior') ||
    lowerMessage.includes('lead') ||
    lowerMessage.includes('principal');
  const isJunior =
    lowerMessage.includes('junior') ||
    lowerMessage.includes('entry') ||
    lowerMessage.includes('associate');
  const isML =
    lowerMessage.includes('ml') ||
    lowerMessage.includes('machine learning') ||
    lowerMessage.includes('ai engineer');
  const isData =
    lowerMessage.includes('data') ||
    lowerMessage.includes('analyst') ||
    lowerMessage.includes('scientist');

  let relevantJobs = jobs;

  if (isSenior) {
    relevantJobs = jobs.filter(
      (job) =>
        job.experienceLevel?.toLowerCase().includes('senior') ||
        job.experienceLevel?.toLowerCase().includes('lead') ||
        job.experienceLevel?.toLowerCase().includes('principal')
    );
  } else if (isJunior) {
    relevantJobs = jobs.filter(
      (job) =>
        job.experienceLevel?.toLowerCase().includes('junior') ||
        job.experienceLevel?.toLowerCase().includes('entry') ||
        job.experienceLevel?.toLowerCase().includes('associate')
    );
  }

  if (isML) {
    relevantJobs = relevantJobs.filter(
      (job) =>
        job.title?.toLowerCase().includes('ml') ||
        job.title?.toLowerCase().includes('machine learning') ||
        job.title?.toLowerCase().includes('ai engineer')
    );
  } else if (isData) {
    relevantJobs = relevantJobs.filter(
      (job) =>
        job.title?.toLowerCase().includes('data') ||
        job.title?.toLowerCase().includes('analyst') ||
        job.title?.toLowerCase().includes('scientist')
    );
  }

  if (relevantJobs.length > 0) {
    const avgMin =
      relevantJobs.reduce((sum, job) => sum + (job.salary?.min || 0), 0) /
      relevantJobs.length;
    const avgMax =
      relevantJobs.reduce((sum, job) => sum + (job.salary?.max || 0), 0) /
      relevantJobs.length;
    const remoteCount = relevantJobs.filter((job) => job.remote).length;

    return (
      `Based on ${relevantJobs.length} relevant positions:\n\n` +
      `• Average salary range: $${Math.round(
        avgMin
      ).toLocaleString()} - $${Math.round(avgMax).toLocaleString()}\n` +
      `• Remote opportunities: ${remoteCount}/${relevantJobs.length}\n` +
      `• Top paying companies: ${getTopPayingCompanies(relevantJobs)
        .slice(0, 3)
        .join(', ')}\n\n` +
      `Salaries vary based on experience, location, and company size. ` +
      `Would you like me to break this down by specific criteria?`
    );
  }

  return (
    `I can help you understand salary ranges for different roles and experience levels. ` +
    `Could you specify the role type (e.g., ML engineer, data scientist) and experience level you're interested in?`
  );
}

function handleRemoteWorkQuestion(
  message: string,
  jobs: Job[],
  companies: Company[]
): string {
  const remoteJobs = jobs.filter((job) => job.remote);
  const totalJobs = jobs.length;
  const remotePercentage = Math.round((remoteJobs.length / totalJobs) * 100);

  const topRemoteCompanies = getTopRemoteCompanies(remoteJobs, companies);
  const remoteByLevel = getRemoteJobsByExperienceLevel(remoteJobs);

  return (
    `Remote work opportunities in AI are growing! Here's what I found:\n\n` +
    `• ${remoteJobs.length} remote positions available (${remotePercentage}% of total)\n` +
    `• Top remote-friendly companies: ${topRemoteCompanies
      .slice(0, 5)
      .join(', ')}\n\n` +
    `Remote jobs by experience level:\n` +
    Object.entries(remoteByLevel)
      .map(([level, count]) => `• ${level}: ${count} positions`)
      .join('\n') +
    `\n\nRemote work offers flexibility and access to opportunities worldwide. ` +
    `Would you like me to show you specific remote positions or filter by other criteria?`
  );
}

function handleSkillsQuestion(
  message: string,
  jobs: Job[],
  companies: Company[]
): string {
  const commonSkills = extractCommonSkills(jobs);
  const emergingSkills = identifyEmergingSkills(jobs);
  const skillDemand = analyzeSkillDemand(jobs);

  return (
    `Here's what I found about skills and requirements in the AI job market:\n\n` +
    `Most in-demand skills:\n` +
    commonSkills
      .slice(0, 8)
      .map((skill) => `• ${skill}`)
      .join('\n') +
    `\n\nEmerging/trending skills:\n` +
    emergingSkills
      .slice(0, 5)
      .map((skill) => `• ${skill}`)
      .join('\n') +
    `\n\nSkill demand by role:\n` +
    Object.entries(skillDemand)
      .slice(0, 5)
      .map(([role, skills]) => `• ${role}: ${skills.slice(0, 3).join(', ')}`)
      .join('\n') +
    `\n\nFocus on building both technical and soft skills. ` +
    `Would you like me to provide specific learning resources or analyze skills for a particular role?`
  );
}

function generateGeneralResponse(
  message: string,
  jobs: Job[],
  companies: Company[]
): string {
  const totalJobs = jobs.length;
  const totalCompanies = companies.length;
  const remoteJobs = jobs.filter((job) => job.remote).length;
  const avgSalary = calculateAverageSalary(jobs);

  return (
    `I'm here to help with your AI career questions! Here's a quick overview of what's available:\n\n` +
    `• ${totalJobs} AI job openings across ${totalCompanies} companies\n` +
    `• ${remoteJobs} remote work opportunities\n` +
    `• Average salary range: $${Math.round(avgSalary).toLocaleString()}+\n\n` +
    `I can help you with:\n` +
    `• Finding jobs that match your skills and experience\n` +
    `• Comparing companies and opportunities\n` +
    `• Understanding salary expectations\n` +
    `• Identifying skill gaps and learning paths\n\n` +
    `What specific aspect of your AI career would you like to explore?`
  );
}

// Helper functions
function extractCommonSkills(jobs: Job[]): string[] {
  const skillCounts: { [key: string]: number } = {};

  jobs.forEach((job) => {
    if (job.tags && Array.isArray(job.tags)) {
      job.tags.forEach((tag: string) => {
        skillCounts[tag] = (skillCounts[tag] || 0) + 1;
      });
    }
  });

  return Object.entries(skillCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([skill]) => skill);
}

function calculateAverageSalary(jobs: Job[]): number {
  const jobsWithSalary = jobs.filter(
    (job) => job.salary?.max && job.salary.max > 0
  );
  if (jobsWithSalary.length === 0) return 0;

  const totalSalary = jobsWithSalary.reduce(
    (sum, job) => sum + (job.salary.max || 0),
    0
  );
  return totalSalary / jobsWithSalary.length;
}

function getTopPayingCompanies(jobs: Job[]): string[] {
  const companySalaries: { [key: string]: number[] } = {};

  jobs.forEach((job) => {
    if (job.company && job.salary?.max) {
      if (!companySalaries[job.company]) {
        companySalaries[job.company] = [];
      }
      companySalaries[job.company].push(job.salary.max);
    }
  });

  return Object.entries(companySalaries)
    .map(([company, salaries]) => ({
      company,
      avgSalary:
        salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length,
    }))
    .sort((a, b) => b.avgSalary - a.avgSalary)
    .map((item) => item.company);
}

function getTopRemoteCompanies(
  remoteJobs: Job[],
  companies: Company[]
): string[] {
  const companyRemoteCounts: { [key: string]: number } = {};

  remoteJobs.forEach((job) => {
    if (job.company) {
      companyRemoteCounts[job.company] =
        (companyRemoteCounts[job.company] || 0) + 1;
    }
  });

  return Object.entries(companyRemoteCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([company]) => company);
}

function getRemoteJobsByExperienceLevel(remoteJobs: Job[]): {
  [key: string]: number;
} {
  const levelCounts: { [key: string]: number } = {};

  remoteJobs.forEach((job) => {
    const level = job.experienceLevel || 'Not specified';
    levelCounts[level] = (levelCounts[level] || 0) + 1;
  });

  return levelCounts;
}

function identifyEmergingSkills(jobs: Job[]): string[] {
  // This is a simplified version - in a real implementation, you might analyze
  // job posting dates and skill frequency trends
  const recentSkills = extractCommonSkills(jobs);
  return recentSkills.slice(0, 5);
}

function analyzeSkillDemand(jobs: Job[]): { [key: string]: string[] } {
  const roleSkills: { [key: string]: string[] } = {};

  jobs.forEach((job) => {
    if (job.title && job.tags) {
      const role = job.title.toLowerCase().includes('engineer')
        ? 'Engineer'
        : job.title.toLowerCase().includes('scientist')
        ? 'Scientist'
        : job.title.toLowerCase().includes('analyst')
        ? 'Analyst'
        : 'Other';

      if (!roleSkills[role]) {
        roleSkills[role] = [];
      }

      job.tags.forEach((tag: string) => {
        if (!roleSkills[role].includes(tag)) {
          roleSkills[role].push(tag);
        }
      });
    }
  });

  return roleSkills;
}

/**
 * Fetches data from the existing CSV API endpoints
 */
async function fetchCSVData(): Promise<{ jobs: Job[]; companies: Company[] }> {
  try {
    // Use the existing CSV data API endpoints
    const [jobsResponse, companiesResponse] = await Promise.all([
      fetch('http://localhost:3000/api/csv-data?type=jobs'),
      fetch('http://localhost:3000/api/csv-data?type=companies'),
    ]);

    if (!jobsResponse.ok || !companiesResponse.ok) {
      throw new Error('Failed to fetch data from CSV endpoints');
    }

    const jobsData = await jobsResponse.json();
    const companiesData = await companiesResponse.json();

    // Transform the data to match our Job and Company interfaces
    const jobs: Job[] = (jobsData.data || []).map(
      (record: {
        id: string;
        name: string;
        company: string;
        location: string;
        remote: string;
        overview: string;
        qualifications: string;
        benefits: string;
        created_at: string;
      }) => ({
        id: record.id || '',
        title: record.name || 'Untitled Position',
        company: record.company || 'Unknown Company',
        companyId: record.id || '',
        location: record.location || 'Remote',
        type: 'full-time' as const,
        remote: record.remote === 'true' || record.remote === 'True',
        salary: { min: 80000, max: 200000, currency: 'USD' },
        description: record.overview || 'No description available',
        requirements: record.qualifications
          ? record.qualifications
              .split(',')
              .map((q: string) => q.trim())
              .filter(Boolean)
          : ['Experience in AI/ML field'],
        benefits: record.benefits
          ? record.benefits
              .split(',')
              .map((b: string) => b.trim())
              .filter(Boolean)
          : ['Competitive salary', 'Health insurance'],
        postedDate: record.created_at || new Date().toISOString(),
        tags: ['AI/ML', 'Technology'],
        experienceLevel: 'mid' as const,
        isSaved: false,
      })
    );

    const companies: Company[] = (companiesData.data || []).map(
      (record: {
        id: string;
        name: string;
        industry: string;
        headquarters: string;
        details: string;
        focus: string;
        size: string;
        founded_year: string;
        website: string;
      }) => ({
        id: record.id,
        name: record.name,
        description: record.details,
        industry: record.industry,
        size: record.size,
        founded: parseInt(record.founded_year) || 2020,
        location: record.headquarters,
        website: record.website,
        benefits: [],
        culture: `AI company focused on ${record.focus} in the ${record.industry} industry.`,
        openPositions: 0,
      })
    );

    // Calculate open positions for each company
    companies.forEach((company) => {
      const companyJobs = jobs.filter((job) => job.company === company.name);
      company.openPositions = companyJobs.length;
    });

    return { jobs, companies };
  } catch (error) {
    console.error('Error fetching CSV data:', error);
    return { jobs: [], companies: [] };
  }
}
