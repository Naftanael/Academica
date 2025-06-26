
import { NextResponse } from 'next/server';

// This file is no longer in use and has been replaced by /api/tv-status/route.ts
// It is kept here to handle any old clients gracefully and to fix a build error
// caused by an empty non-module file.
export async function GET() {
  // Return a 410 Gone response to indicate the endpoint is permanently removed.
  return NextResponse.json(
    { message: 'This API endpoint is deprecated.' },
    { status: 410 }
  );
}
