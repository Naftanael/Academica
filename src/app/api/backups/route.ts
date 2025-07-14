
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const backupDir = path.resolve(process.cwd(), 'backups');
  try {
    const files = await fs.promises.readdir(backupDir);
    const backups = files
      .filter(file => file.endsWith('.tar.gz'))
      .map(file => {
        const stats = fs.statSync(path.join(backupDir, file));
        return {
          name: file,
          size: stats.size,
          createdAt: stats.ctime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return NextResponse.json(backups);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json([]);
    }
    console.error('Failed to list backups:', error);
    return NextResponse.json({ error: 'Failed to list backups' }, { status: 500 });
  }
}
