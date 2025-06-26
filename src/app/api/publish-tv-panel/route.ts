
'use server';

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import chromium from 'chrome-aws-lambda';
import { readData } from '@/lib/data-utils';
import { getCurrentShift } from '@/lib/utils';
import type { ClassGroup, Classroom, TvDisplayInfo, PublishedTvData } from '@/types';

// Helper function to generate the full HTML for the panel
function getPanelHtml(displayData: TvDisplayInfo[], publishedDate: string): string {
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 20h20"/><path d="M14 12v.01"/></svg>
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
                      <p class="classroom-name text-destructive">Não Atribuída</p>
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
            <p class="no-classes-subtitle">Verifique novamente mais tarde ou publique os dados.</p>
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
                  --background: 210 20% 12%; --foreground: 0 0% 98%; --card: 210 20% 14%;
                  --card-foreground: 0 0% 98%; --primary: 96 56% 53%; --primary-foreground: 222 47% 11%;
                  --accent: 100 65% 37%; --destructive: 0 84.2% 60.2%; --border: 217.2 32.6% 17.5%;
                }
                body { background-color: hsl(var(--primary)); color: hsl(var(--foreground)); font-family: "Inter", sans-serif; margin: 0; padding: 2rem; height: 100vh; width: 100vw; box-sizing: border-box; display: flex; flex-direction: column; }
                header { text-align: center; margin-bottom: 2rem; color: hsl(var(--foreground)); flex-shrink: 0; }
                header h1 { font-size: 4rem; font-weight: 800; margin: 0; display: flex; align-items: center; justify-content: center; gap: 1.5rem; }
                header h1 svg { width: 4.5rem; height: 4.5rem; }
                header p { font-size: 2.5rem; margin: 0.5rem 0 0 0; opacity: 0.9; }
                main { flex: 1; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; overflow: hidden; }
                .card { background-color: hsla(var(--card), 0.8); border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid hsl(var(--border) / 0.7); border-left: 8px solid hsl(var(--primary)); }
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
                .text-destructive { color: hsl(var(--destructive)); }
                .no-classes-card { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 1rem; color: hsl(var(--foreground)); }
                .no-classes-card .icon-large { width: 8rem; height: 8rem; color: hsl(var(--accent)); margin-bottom: 1.5rem; }
                .no-classes-title { font-size: 3rem; font-weight: 600; }
                .no-classes-subtitle { font-size: 1.75rem; opacity: 0.8; margin-top: 0.5rem; }
            </style>
        </head>
        <body>
            <header>
                <h1>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/><path d="M15 10l-4 4 4 4"/><path d="M9 10v8"/></svg>
                    Guia de Salas
                </h1>
                <p>${publishedDate}</p>
            </header>
            <main>${cardsHtml}</main>
        </body>
        </html>
    `;
}


export async function POST() {
  let browser = null;
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
    
    // 3. Generate HTML content
    const publishedDate = now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const htmlContent = getPanelHtml(displayData, publishedDate);

    // 4. Launch Puppeteer using chrome-aws-lambda
    browser = await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // 5. Take screenshot and save to public directory
    const publicDir = path.join(process.cwd(), 'public');
    const imagePath = path.join(publicDir, 'tv_panel.png');
    await fs.mkdir(publicDir, { recursive: true });
    await page.screenshot({ path: imagePath, type: 'png' });
    
    return NextResponse.json({ success: true, message: 'Painel de TV publicado com sucesso.' });

  } catch (error) {
    console.error('Error publishing TV panel data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
    return NextResponse.json({ success: false, message: `Falha ao publicar painel: ${errorMessage}` }, { status: 500 });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
