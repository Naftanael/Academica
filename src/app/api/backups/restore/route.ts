
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST(request: Request) {
  const { backupFile } = await request.json();

  if (!backupFile || typeof backupFile !== 'string') {
    return NextResponse.json({ error: 'Invalid backup file' }, { status: 400 });
  }

  try {
    const { stdout, stderr } = await execPromise(`tar -xzf backups/${backupFile} -C .`);
    if (stderr) {
      console.error('Restore script stderr:', stderr);
      return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Backup restored successfully', output: stdout });
  } catch (error) {
    console.error('Failed to restore backup:', error);
    return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 });
  }
}
