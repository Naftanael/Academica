// This file is obsolete.
// The logic has been migrated to server actions in /src/lib/actions/classrooms.ts
// to align with modern Next.js 14+ best practices.
// Keeping the file to prevent 404 errors until all client-side calls are updated.

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'This API endpoint is obsolete and no longer available.' }, 
    { status: 410 } // HTTP 410 Gone
  );
}

export async function PUT() {
    return NextResponse.json(
      { error: 'This API endpoint is obsolete and no longer available.' }, 
      { status: 410 } // HTTP 410 Gone
    );
}

export async function DELETE() {
    return NextResponse.json(
      { error: 'This API endpoint is obsolete and no longer available.' }, 
      { status: 410 } // HTTP 410 Gone
    );
}