import { Company, CompanySearchResult } from './util/types';
import {
  generateId,
  getCurrentTimestamp,
  writeCompaniesToCsv,
  ensureDataDirectory,
} from './util/utils';
import { getOpenAIClient, validateApiKey } from './util/openai-client';
import { extractAndParseJson, createJsonPrompt } from './util/json-utils';
import { logError, logSuccess, logInfo } from './util/error-handling';

async function findAICompanies(): Promise<CompanySearchResult[]> {
  logInfo('Searching for AI companies', 'Using OpenAI deep research...');

  try {
    const prompt = createJsonPrompt(
      'You are a research assistant specializing in finding AI companies in the United States. Provide detailed, accurate information about AI companies. Always respond with valid JSON only.',
      `Please research and find companies working on AIacross different industries in the United States. 
      For each company, provide:
      - Company name
      - Industry/sector they operate in
      - AI focus area (e.g., machine learning, computer vision, NLP, robotics, etc.)
      - Website URL if available
      
      Include companies of all stages and sizes. There should be at least 100 companies in the JSON array.
      
      IMPORTANT: Respond with ONLY a valid JSON array, no other text. Use this exact structure:
      [
        {
          "name": "Company Name",
          "industry": "Industry/Sector",
          "focus": "AI Focus Area",
          "website": "https://example.com",
        }
      ]`
    );

    const completion = await getOpenAIClient().chat.completions.create(prompt);
    const content = completion.choices[0]?.message?.content;

    console.log('Raw OpenAI response:', content?.substring(0, 1000) + '...');

    const companies: CompanySearchResult[] = extractAndParseJson<
      CompanySearchResult[]
    >(content!, 'array', 'AI companies search');

    logSuccess('AI companies search', `Found ${companies.length} companies`);
    return companies;
  } catch (error) {
    logError('AI companies search', error);
    throw error;
  }
}

async function main() {
  try {
    validateApiKey();
    ensureDataDirectory();

    const companies = await findAICompanies();

    // Convert to Company format with generated IDs and timestamps
    const formattedCompanies: Partial<Company>[] = companies.map((company) => ({
      id: generateId(),
      name: company.name,
      industry: company.industry,
      focus: company.focus,
      website: company.website || 'Unknown',
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
    }));

    // Write to CSV
    await writeCompaniesToCsv(formattedCompanies);
    logSuccess(
      'Data export',
      `Saved ${formattedCompanies.length} companies to csv/companies.csv`
    );
  } catch (error) {
    logError('main function', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
