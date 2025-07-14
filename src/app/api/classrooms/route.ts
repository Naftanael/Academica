
import { NextResponse } from 'next/server';
import { getClassrooms, createClassroom } from '@/lib/actions/classrooms';
import { z } from 'zod';

export async function GET() {
  try {
    const classrooms = await getClassrooms();
    return NextResponse.json(classrooms);
  } catch (error) {
    console.error('Failed to get classrooms:', error);
    return NextResponse.json({ message: 'Failed to get classrooms' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const result = await createClassroom(json);

        if (result.success) {
            return NextResponse.json(result.data, { status: 201 });
        } else {
            return NextResponse.json({ message: result.message, errors: result.errors }, { status: 400 });
        }
    } catch (error) {
        console.error('Failed to create classroom:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Validation error', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        return NextResponse.json({ message: 'Failed to create classroom' }, { status: 500 });
    }
}
