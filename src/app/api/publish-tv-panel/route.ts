
'use server';

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { readData } from '@/lib/data-utils';
import { getCurrentShift } from '@/lib/utils';
import type { ClassGroup, Classroom, TvDisplayInfo } from '@/types';

// Helper function to generate the static HTML for the TV panel
function generateTvPanelHtml(displayData: TvDisplayInfo[], currentDate: string): string {
  const cardsHtml = displayData.length > 0 
    ? displayData.map(item => `
      <div class="card">
        <div class="card-content">
          <h2 class="group-name">${item.groupName}</h2>
          <p class="shift-info">Turno: <span class="shift-value">${item.shift}</span></p>
        </div>
        <div class="classroom-info">
          ${item.classroomName ? `
            <div class="classroom-details">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M13 4h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><path d="M2 20h7a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H2"/></svg>
              <div>
                <p class="classroom-label">Sala</p>
                <p class="classroom-name">${item.classroomName}</p>
              </div>
            </div>
          ` : `
            <div class="classroom-details unavailable">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <div>
                <p class="classroom-label">Sala</p>
                <p class="classroom-name">Não Atribuída</p>
              </div>
            </div>
          `}
        </div>
      </div>
    `).join('')
    : `
      <div class="no-classes-card">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-large"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        <p class="no-classes-title">Nenhuma turma em andamento.</p>
        <p class="no-classes-subtitle">Verifique novamente mais tarde.</p>
      </div>
    `;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Painel de Salas</title>
        <style>
            :root {
              --background: 210 20% 12%;
              --foreground: 0 0% 98%;
              --card: 210 20% 14%;
              --card-foreground: 0 0% 98%;
              --primary: 96 56% 53%;
              --primary-foreground: 222 47% 11%;
              --accent: 100 65% 37%;
              --destructive: 0 62.8% 30.6%;
              --border: 217.2 32.6% 17.5%;
              --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
            }
            *, *::before, *::after { box-sizing: border-box; }
            body { 
              margin: 0; 
              overflow: hidden; 
              background-color: hsl(var(--primary)); 
              font-family: var(--font-sans);
              color: hsl(var(--foreground));
              display: flex;
              flex-direction: column;
              height: 100vh;
              padding: 2rem;
            }
            header {
              text-align: center;
              margin-bottom: 2rem;
              color: hsl(var(--foreground));
            }
            header h1 {
              font-size: 4rem;
              font-weight: 800;
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 1.5rem;
            }
            header p {
              font-size: 2.5rem;
              margin: 0.5rem 0 0 0;
              opacity: 0.9;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
              gap: 1.5rem;
              width: 100%;
              flex: 1;
              overflow: hidden;
            }
            .card {
              background-color: hsla(var(--card), 0.8);
              border-radius: 0.5rem;
              box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
              padding: 1rem;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              border: 1px solid hsl(var(--border) / 0.7);
              border-left: 8px solid hsl(var(--primary));
            }
            .card-content { flex-grow: 1; margin-bottom: 0.5rem; }
            .group-name { font-size: 2.5rem; font-weight: 700; color: hsl(var(--foreground)); margin: 0 0 0.5rem 0; word-break: break-word; }
            .shift-info { font-size: 1.5rem; color: hsl(var(--card-foreground) / 0.7); }
            .shift-value { font-weight: 600; color: hsl(var(--card-foreground)); }
            .classroom-info { margin-top: auto; padding-top: 0.75rem; border-top: 1px solid hsl(var(--border) / 0.5); }
            .classroom-details { display: flex; align-items: center; gap: 1rem; }
            .classroom-details .icon { width: 3.5rem; height: 3.5rem; color: hsl(var(--accent)); flex-shrink: 0; }
            .classroom-details.unavailable .icon { color: hsl(var(--destructive)); }
            .classroom-label { font-size: 1.25rem; text-transform: uppercase; letter-spacing: 0.05em; color: hsl(var(--card-foreground) / 0.7); margin: 0;}
            .classroom-name { font-size: 2rem; font-weight: 600; color: hsl(var(--card-foreground)); margin: 0; word-break: break-word; }
            .classroom-details.unavailable .classroom-name { color: hsl(var(--destructive)); }

            .no-classes-card {
                grid-column: 1 / -1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 1rem;
                color: hsl(var(--foreground));
            }
            .no-classes-card .icon-large { width: 8rem; height: 8rem; color: hsl(var(--accent)); margin-bottom: 1.5rem; }
            .no-classes-title { font-size: 3rem; font-weight: 600; }
            .no-classes-subtitle { font-size: 1.75rem; opacity: 0.8; margin-top: 0.5rem; }
        </style>
    </head>
    <body>
        <header>
            <h1>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:4.5rem; height:4.5rem;"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h8"/><path d="M18 4v10"/><path d="M14 10h4"/><path d="M14 6h4"/></svg>
              Guia de Salas
            </h1>
            <p>${currentDate}</p>
        </header>
        <main class="grid-container">
            ${cardsHtml}
        </main>
    </body>
    </html>
  `;
}

// This API route generates a static HTML file with the current TV panel data
// and saves it to the public directory.
export async function POST() {
  try {
    // 1. Fetch data
    const classGroups = await readData<ClassGroup>('classgroups.json');
    const classrooms = await readData<Classroom>('classrooms.json');
    
    // 2. Process data
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
    
    // 3. Generate HTML content
    const currentDate = now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const htmlContent = generateTvPanelHtml(displayData, currentDate);

    // 4. Write to public file
    const filePath = path.join(process.cwd(), 'public', 'tv_panel.html');
    await fs.writeFile(filePath, htmlContent, 'utf-8');

    return NextResponse.json({ success: true, message: 'Painel de TV publicado com sucesso.' });
  } catch (error) {
    console.error('Error publishing TV panel:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
    return NextResponse.json({ success: false, message: `Falha ao publicar painel: ${errorMessage}` }, { status: 500 });
  }
}

