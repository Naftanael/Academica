
import { NextResponse } from 'next/server';

// This API endpoint is deprecated and no longer in use.
// The TV panel system has been refactored to use a server-generated static image.
// This file is kept to handle any old clients gracefully and to fix a build error
// caused by an empty non-module file.
export async function GET() {
  // Return a 410 Gone response to indicate the endpoint is permanently removed.
  return NextResponse.json(
    { message: 'This API endpoint is deprecated.' },
    { status: 410 }
  );
}
