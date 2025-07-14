
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST() {
  try {
    const { stdout, stderr } = await execPromise('./scripts/backup.sh');
    if (stderr) {
      console.error('Backup script stderr:', stderr);
      return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Backup created successfully', output: stdout });
  } catch (error) {
    console.error('Failed to create backup:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}
