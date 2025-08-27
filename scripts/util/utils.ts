import { v4 as uuidv4 } from 'uuid';
import { createObjectCsvWriter } from 'csv-writer';
import { Company, Job, Address } from './types';
import * as fs from 'fs';
import * as path from 'path';

export function generateId(): string {
  return uuidv4();
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function createCsvWriter<T>(
  filePath: string,
  headers: Array<{ id: keyof T; title: string }>
) {
  return createObjectCsvWriter({
    path: filePath,
    header: headers.map((header) => header.title) as string[],
  });
}

export function writeCompaniesToCsv(
  companies: Partial<Company>[],
  filePath: string = './csv/companies.csv'
) {
  const csvWriter = createCsvWriter<Company>(filePath, [
    { id: 'id', title: 'id' },
    { id: 'name', title: 'name' },
    { id: 'industry', title: 'industry' },
    { id: 'focus', title: 'focus' },
    { id: 'details', title: 'details' },
    { id: 'size', title: 'size' },
    { id: 'stage', title: 'stage' },
    { id: 'funding', title: 'funding' },
    { id: 'founded_year', title: 'founded_year' },
    { id: 'headquarters', title: 'headquarters' },
    { id: 'website', title: 'website' },
    { id: 'created_at', title: 'created_at' },
    { id: 'updated_at', title: 'updated_at' },
  ]);

  return csvWriter.writeRecords(companies);
}

export function writeJobsToCsv(
  jobs: Job[],
  filePath: string = './csv/jobs.csv'
) {
  const csvWriter = createCsvWriter<Job>(filePath, [
    { id: 'id', title: 'id' },
    { id: 'company', title: 'company' },
    { id: 'name', title: 'name' },
    { id: 'overview', title: 'overview' },
    { id: 'responsibilities', title: 'responsibilities' },
    { id: 'qualifications', title: 'qualifications' },
    { id: 'optional_qualifications', title: 'optional_qualifications' },
    { id: 'location', title: 'location' },
    { id: 'benefits', title: 'benefits' },
    { id: 'remote', title: 'remote' },
    { id: 'created_at', title: 'created_at' },
    { id: 'updated_at', title: 'updated_at' },
    { id: 'is_open', title: 'is_open' },
  ]);

  return csvWriter.writeRecords(jobs);
}

export function writeAddressesToCsv(
  addresses: Address[],
  filePath: string = './csv/addresses.csv'
) {
  const csvWriter = createCsvWriter<Address>(filePath, [
    { id: 'id', title: 'id' },
    { id: 'city', title: 'city' },
    { id: 'state', title: 'state' },
    { id: 'country', title: 'country' },
    { id: 'street_address', title: 'street_address' },
    { id: 'created_at', title: 'created_at' },
    { id: 'updated_at', title: 'updated_at' },
  ]);

  return csvWriter.writeRecords(addresses);
}

export function ensureDataDirectory(): void {
  const dataDir = path.join(process.cwd(), 'csv');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function parseArrayField(field: string): string[] {
  if (!field) return [];
  return field
    .split('|')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function formatArrayField(array: string[]): string {
  return array.join('|');
}
