/**
 * Script to gather detailed company information and extract headquarters data
 *
 * This script:
 * 1. Reads companies from companies.csv
 * 2. Gathers detailed information for each company using AI
 * 3. Parses headquarters addresses into structured components
 * 4. Writes parsed address data to addresses.csv
 * 5. Updates companies.csv with detailed information and address references
 */

import { Company, CompanyDetailResult, Address } from './util/types';
import {
  generateId,
  getCurrentTimestamp,
  writeCompaniesToCsv,
  writeAddressesToCsv,
  ensureDataDirectory,
} from './util/utils';
import { getOpenAIClient, validateApiKey } from './util/openai-client';
import { extractAndParseJson, createJsonPrompt } from './util/json-utils';
import {
  logError,
  logSuccess,
  logInfo,
  createBatchProcessor,
} from './util/error-handling';
import * as path from 'path';
import * as fs from 'fs';
import csv from 'csv-parser';

interface CompanyRow {
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

async function getDetailedCompanyInfo(
  companyName: string
): Promise<CompanyDetailResult> {
  logInfo('Gathering detailed information', `for ${companyName}...`);

  try {
    const prompt = createJsonPrompt(
      'You are a business research assistant. Provide accurate, detailed information about companies including their size, stage, funding, and founding details. Always respond with valid JSON only.',
      `Please research and provide detailed information about ${companyName}. For this company, provide:
      - Company name
      - Industry/sector
      - AI focus area
      - Detailed description of what they do
      - Company size (number of employees)
      - Company stage (Startup, Growth, Established, Enterprise)
      - Funding status (Bootstrapped, Seed, Series A, Series B, Series C, Series D+, Public, Acquired)
      - Founded year
      - Headquarters location (address,city, state, zip code, country)
      - Website URL
      
      IMPORTANT: Respond with ONLY a valid JSON object, no other text. Use this exact structure:
      {
        "name": "Company Name",
        "industry": "Industry/Sector",
        "focus": "AI Focus Area",
        "details": "Detailed description",
        "size": 1000,
        "stage": "Growth",
        "funding": "Series B",
        "founded_year": 2015,
        "headquarters": "123 Main St, San Francisco, CA 94101, USA",
        "website": "https://example.com"
      }`
    );

    const completion = await getOpenAIClient().chat.completions.create(prompt);
    const content = completion.choices[0]?.message?.content;

    const companyInfo: CompanyDetailResult =
      extractAndParseJson<CompanyDetailResult>(
        content!,
        'object',
        `detailed info for ${companyName}`
      );

    logSuccess('Company research', `Gathered detailed info for ${companyName}`);
    return companyInfo;
  } catch (error) {
    logError(`detailed info for ${companyName}`, error);
    throw error;
  }
}

async function readCompaniesFromCsv(filePath: string): Promise<CompanyRow[]> {
  return new Promise((resolve, reject) => {
    const companies: CompanyRow[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: unknown) => {
        const companyRow = row as CompanyRow;
        companies.push({
          id: companyRow.id,
          name: companyRow.name,
          industry: companyRow.industry,
          focus: companyRow.focus,
          details: companyRow.details,
          size: companyRow.size,
          stage: companyRow.stage,
          funding: companyRow.funding,
          founded_year: companyRow.founded_year,
          headquarters: companyRow.headquarters,
          website: companyRow.website,
          created_at: companyRow.created_at,
          updated_at: companyRow.updated_at,
        });
      })
      .on('end', () => resolve(companies))
      .on('error', reject);
  });
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

    const companies = await readCompaniesFromCsv(companiesPath);
    logInfo(
      'Company processing',
      `Found ${companies.length} companies to process`
    );

    const updatedCompanies: Company[] = [];
    const addresses: Address[] = [];
    const addressMap = new Map<string, string>(); // location -> address_id

    // Process companies in batches
    const batchSize = 3;
    const processCompany = async (company: CompanyRow, index: number) => {
      try {
        const detailedInfo = await getDetailedCompanyInfo(company.name);

        // Handle address
        const location = detailedInfo.headquarters;
        let addressId = addressMap.get(location);

        if (!addressId) {
          addressId = generateId();
          addressMap.set(location, addressId);

          // Parse location into address components
          const locationParts = location.split(',').map((part) => part.trim());

          // More sophisticated address parsing
          let streetAddress = 'Unknown';
          let city = 'Unknown';
          let state = 'Unknown';
          let country = 'Unknown';

          if (locationParts.length >= 4) {
            // Format: "123 Main St, San Francisco, CA 94101, USA"
            streetAddress = locationParts[0];
            city = locationParts[1];
            state = locationParts[2];
            country = locationParts[3];
          } else if (locationParts.length === 3) {
            // Format: "San Francisco, CA, USA" (no street address)
            city = locationParts[0];
            state = locationParts[1];
            country = locationParts[2];
          } else if (locationParts.length === 2) {
            // Format: "San Francisco, CA" or "London, UK"
            city = locationParts[0];
            state = locationParts[1];
            // Try to determine if second part is state or country
            if (state.length <= 3 && /^[A-Z]{2,3}$/.test(state)) {
              // Likely a state abbreviation, set country to USA
              country = 'USA';
            } else {
              // Likely a country, set state to unknown
              country = state;
              state = 'Unknown';
            }
          } else if (locationParts.length === 1) {
            // Single location like "London" or "San Francisco"
            city = locationParts[0];
          }

          const address: Address = {
            id: addressId,
            city: city,
            state: state,
            country: country,
            street_address: streetAddress,
            created_at: getCurrentTimestamp(),
            updated_at: getCurrentTimestamp(),
          };
          addresses.push(address);

          logInfo(
            'Address parsing',
            `Parsed "${location}" into: ${streetAddress}, ${city}, ${state}, ${country}`
          );
        }

        // Update company with detailed information
        const updatedCompany: Company = {
          id: company.id,
          name: detailedInfo.name,
          industry: detailedInfo.industry,
          focus: detailedInfo.focus,
          details: detailedInfo.details,
          size: detailedInfo.size,
          stage: detailedInfo.stage,
          funding: detailedInfo.funding,
          founded_year: detailedInfo.founded_year,
          headquarters: addressId,
          website: detailedInfo.website,
          created_at: company.created_at,
          updated_at: getCurrentTimestamp(),
        };

        updatedCompanies.push(updatedCompany);
        logSuccess(
          'Company processing',
          `Successfully processed ${company.name}`
        );
      } catch (error) {
        logError(`Company processing for ${company.name}`, error);
        // Continue with next company instead of stopping the entire process
      }
    };

    const batchProcessor = createBatchProcessor(
      companies,
      batchSize,
      processCompany
    );

    await batchProcessor();

    if (updatedCompanies.length === 0) {
      throw new Error('No companies were successfully processed');
    }

    // Write updated companies to CSV
    await writeCompaniesToCsv(updatedCompanies, './csv/companies.csv');
    logSuccess(
      'Data export',
      `Updated ${updatedCompanies.length} companies in csv/companies.csv`
    );

    // Write addresses to CSV
    await writeAddressesToCsv(addresses);
    logSuccess(
      'Data export',
      `Saved ${addresses.length} addresses to csv/addresses.csv`
    );

    // Log summary of address processing
    const uniqueAddresses = new Set(
      addresses.map((addr) => `${addr.city}, ${addr.state}, ${addr.country}`)
    );
    logInfo(
      'Address summary',
      `Processed ${addresses.length} total addresses for ${uniqueAddresses.size} unique locations`
    );
  } catch (error) {
    logError('main function', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
