import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

interface CSVRecord {
  [key: string]: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type');

    if (!dataType || !['jobs', 'companies'].includes(dataType)) {
      return NextResponse.json(
        { error: 'Data type must be "jobs" or "companies"' },
        { status: 400 }
      );
    }

    const csvPath = path.join(
      process.cwd(),
      'scripts',
      'csv',
      `${dataType}.csv`
    );

    try {
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (dataType === 'jobs') {
        records.forEach((record: unknown) => {
          const jobRecord = record as CSVRecord;
          if (
            jobRecord.location &&
            jobRecord.location.length === 36 &&
            jobRecord.location.includes('-')
          ) {
            jobRecord.location = 'San Francisco, CA';
          }
        });
      }

      return NextResponse.json({ data: records });
    } catch (fileError) {
      console.error(`Error reading ${dataType}.csv:`, fileError);

      // Return empty data if file reading fails
      return NextResponse.json({ data: [] });
    }
  } catch (error) {
    console.error('Error in CSV data API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CSV data' },
      { status: 500 }
    );
  }
}
