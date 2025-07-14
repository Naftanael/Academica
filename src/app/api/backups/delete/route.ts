
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const { backupFile } = await request.json();

  if (!backupFile || typeof backupFile !== 'string') {
    return NextResponse.json({ error: 'Invalid backup file' }, { status: 400 });
  }

  const backupDir = path.resolve(process.cwd(), 'backups');
  const filePath = path.join(backupDir, backupFile);

  try {
    await fs.promises.unlink(filePath);
    return NextResponse.json({ message: 'Backup deleted successfully' });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    console.error('Failed to delete backup:', error);
    return NextResponse.json({ error: 'Failed to delete backup' }, { status: 500 });
  }
}
