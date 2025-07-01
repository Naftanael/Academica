import { NextResponse } from 'next/server';

/**
 * @deprecated This API route is obsolete and should not be used. It may be removed in a future version.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'This API endpoint is obsolete and no longer available.' }, 
    { status: 410 } // HTTP 410 Gone
  );
}

/**
 * @deprecated This API route is obsolete and should not be used. It may be removed in a future version.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'This API endpoint is obsolete and no longer available.' }, 
    { status: 410 } // HTTP 410 Gone
  );
}
