
import { NextResponse } from 'next/server';
import { getClassroomById, updateClassroom, deleteClassroom } from '@/lib/actions/classrooms';
import { z } from 'zod';

type Params = {
    params: {
        id: string;
    }
}

export async function GET(request: Request, { params }: Params) {
    try {
        const classroom = await getClassroomById(params.id);
        if (!classroom) {
            return NextResponse.json({ message: 'Classroom not found' }, { status: 404 });
        }
        return NextResponse.json(classroom);
    } catch (error) {
        console.error(`Failed to get classroom ${params.id}:`, error);
        return NextResponse.json({ message: 'Failed to get classroom' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: Params) {
    try {
        const json = await request.json();
        const result = await updateClassroom(params.id, json);

        if (result.success) {
            return NextResponse.json({ message: result.message }, { status: 200 });
        } else {
            return NextResponse.json({ message: result.message, errors: result.errors }, { status: 400 });
        }
    } catch (error) {
        console.error(`Failed to update classroom ${params.id}:`, error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Validation error', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        return NextResponse.json({ message: 'Failed to update classroom' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: Params) {
    try {
        const result = await deleteClassroom(params.id);
        if (result.success) {
            return NextResponse.json({ message: 'Classroom deleted successfully' }, { status: 200 });
        } else {
            return NextResponse.json({ message: result.message }, { status: 400 });
        }
    } catch (error) {
        console.error(`Failed to delete classroom ${params.id}:`, error);
        return NextResponse.json({ message: 'Failed to delete classroom' }, { status: 500 });
    }
}
