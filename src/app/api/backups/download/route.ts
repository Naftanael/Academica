
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');

  if (!file) {
    return NextResponse.json({ error: 'File not specified' }, { status: 400 });
  }
  
  const backupDir = path.resolve(process.cwd(), 'backups');
  const filePath = path.join(backupDir, file);

  try {
    const stats = await fs.promises.stat(filePath);
    const stream = fs.createReadStream(filePath);
    
    return new NextResponse(stream as any, {
      headers: {
        'Content-Disposition': `attachment; filename="${file}"`,
        'Content-Type': 'application/gzip',
        'Content-Length': stats.size.toString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    console.error('Failed to download backup:', error);
    return NextResponse.json({ error: 'Failed to download backup' }, { status: 500 });
  }
}
