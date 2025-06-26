
'use server';

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { readData } from '@/lib/data-utils';
import { getCurrentShift } from '@/lib/utils';
import type { ClassGroup, Classroom, TvDisplayInfo, PublishedTvData } from '@/types';

// This API route processes the current data, prepares it for display,
// and saves it to a dedicated JSON file that the TV display page will read from.
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
    
    // 3. Prepare the data payload for publishing
    const publishedDate = now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const publishedContent: PublishedTvData = {
      data: displayData,
      publishedDate: publishedDate,
    };

    // 4. Write to the dedicated data file
    const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'src', 'data');
    const filePath = path.join(dataDir, 'published_tv_data.json');
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(publishedContent, null, 2), 'utf-8');

    return NextResponse.json({ success: true, message: 'Painel de TV publicado com sucesso.' });
  } catch (error) {
    console.error('Error publishing TV panel data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
    return NextResponse.json({ success: false, message: `Falha ao publicar painel: ${errorMessage}` }, { status: 500 });
  }
}
