
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

const defaultDataPath = path.join(process.cwd(), 'src', 'data');
const dataDirFromEnv = process.env.DATA_DIR;
const dataDir = dataDirFromEnv || defaultDataPath;
const tvStatusFilePath = path.join(dataDir, 'tv-publish-status.json');

interface TvStatus {
  lastPublished: number;
}

export async function GET() {
  try {
    const fileContents = await fs.readFile(tvStatusFilePath, 'utf-8');
    const statusData: TvStatus = JSON.parse(fileContents);
    
    return NextResponse.json({
      lastPublished: statusData.lastPublished,
      serverTime: Date.now()
    });
  } catch (error) {
    // If file doesn't exist or is invalid, return a default/error state
    // The publish button will create it on first press.
    console.warn('Could not read tv-publish-status.json, returning default. Error:', (error as Error).message);
    return NextResponse.json({
      lastPublished: 0, // A default value that will trigger a refresh on clients that have a different value
      serverTime: Date.now()
    });
  }
}
