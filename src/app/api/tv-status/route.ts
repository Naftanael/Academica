
import { NextResponse } from 'next/server';
import { readData } from '@/lib/data-utils';

interface TvPublishStatus {
  lastPublished: number | null;
}

// This API route is polled by the TV display clients.
// It reads the last published timestamp from a file and returns it.
export async function GET() {
  try {
    const statusData = await readData<TvPublishStatus>('tv-publish-status.json');
    
    // readData returns an array. We expect a single status object in this file.
    const lastStatus = statusData[0] || { lastPublished: null };

    return NextResponse.json(lastStatus);
  } catch (error) {
    console.error('Error reading TV panel status:', error);
    // On error, we can return null to avoid breaking the client,
    // which will just keep its existing `lastPublished` value.
    return NextResponse.json({ lastPublished: null }, { status: 500 });
  }
}
