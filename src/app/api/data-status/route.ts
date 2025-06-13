
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'src', 'data');
const classGroupsFilePath = path.join(dataDir, 'classgroups.json');
const classroomsFilePath = path.join(dataDir, 'classrooms.json');

async function getFileMtime(filePath: string): Promise<number | null> {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtimeMs;
  } catch (error) {
    // If file doesn't exist or other error, log it and return null.
    // The client can decide how to interpret a null mtime (e.g., data potentially unavailable).
    // console.error(`Error getting mtime for ${filePath}:`, (error as Error).message);
    return null;
  }
}

export async function GET() {
  try {
    const classGroupsMtime = await getFileMtime(classGroupsFilePath);
    const classroomsMtime = await getFileMtime(classroomsFilePath);

    return NextResponse.json({
      classGroupsMtime,
      classroomsMtime,
      serverTime: Date.now() // Provides a server reference time for the client
    });
  } catch (error) {
    console.error('Error in /api/data-status:', error);
    return NextResponse.json({ error: 'Failed to get data status' }, { status: 500 });
  }
}
