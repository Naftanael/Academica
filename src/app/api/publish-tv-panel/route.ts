
import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/data-utils';
import type { ClassGroup, Classroom } from '@/types';

export async function POST() {
  try {
    const [classGroups, classrooms] = await Promise.all([
      readData<ClassGroup>('classgroups.json'),
      readData<Classroom>('classrooms.json'),
    ]);

    const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));

    const tvData = classGroups
      .filter(cg => cg.status === 'Em Andamento')
      .map(cg => ({
        id: cg.id,
        groupName: cg.name,
        shift: cg.shift,
        classroomName: cg.assignedClassroomId
          ? classroomMap.get(cg.assignedClassroomId) ?? 'N/A'
          : 'N/A',
        classDays: cg.classDays,
        startDate: cg.startDate,
        endDate: cg.endDate,
      }))
      .sort((a, b) => (a.classroomName > b.classroomName ? 1 : -1));

    await writeData('published_tv_data.json', tvData);
    await writeData('tv-publish-status.json', [{ lastUpdated: new Date().toISOString(), lastPublished: new Date().toISOString() }]);
    
    return NextResponse.json(
      { message: 'TV panel data published successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to publish TV panel data:', error);
    return NextResponse.json(
      { message: 'Failed to publish TV panel data.' },
      { status: 500 }
    );
  }
}
