
import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/data-utils';
import { getCurrentShift } from '@/lib/utils';
import type { ClassGroup, Classroom, TvDisplayInfo, PublishedTvData } from '@/types';

// This API route no longer generates an image. Instead, it processes the class
// data and writes it to a JSON file, which the TV Display page will read directly.
export async function POST() {
  try {
    // 1. Fetch source data
    const classGroups = await readData<ClassGroup>('classgroups.json');
    const classrooms = await readData<Classroom>('classrooms.json');
    
    // 2. Process data for display
    const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));
    const now = new Date();
    const currentShift = getCurrentShift(now.getHours());
    
    let displayData: TvDisplayInfo[] = [];
    if (currentShift) {
      displayData = classGroups
        .filter(cg => cg.status === 'Em Andamento' && cg.shift === currentShift)
        .map(cg => ({
          id: cg.id,
          groupName: cg.name,
          shift: cg.shift,
          classroomName: cg.assignedClassroomId ? classroomMap.get(cg.assignedClassroomId) ?? null : null,
        }))
        .sort((a, b) => a.groupName.localeCompare(b.groupName));
    }
    
    // 3. Format the data payload
    const publishedDate = now.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const dataToPublish: PublishedTvData = {
      data: displayData,
      publishedDate: publishedDate,
    };

    // 4. Write data to the JSON file
    await writeData('published_tv_data.json', [dataToPublish]);
    
    return NextResponse.json({ success: true, message: 'Painel de TV publicado com sucesso.' });

  } catch (error) {
    console.error('Error publishing TV panel data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
    return NextResponse.json({ success: false, message: `Falha ao publicar painel: ${errorMessage}` }, { status: 500 });
  }
}
