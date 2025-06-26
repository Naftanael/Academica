
import fs from 'fs/promises';
import path from 'path';
import { DoorOpen, AlertTriangle, MonitorPlay } from 'lucide-react';
import type { TvDisplayInfo, PublishedTvData } from '@/types';
import ClientRefresher from '@/components/tv-display/ClientRefresher';
import { cn } from '@/lib/utils';

async function getPublishedData(): Promise<PublishedTvData> {
  const defaultData: PublishedTvData = {
    data: [],
    publishedDate: 'Carregando dados...'
  };

  try {
    const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'src', 'data');
    const filePath = path.join(dataDir, 'published_tv_data.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent) as PublishedTvData;
  } catch (error) {
    console.warn('Could not read published TV data, returning default. This may be expected if nothing has been published yet.', error);
    return defaultData;
  }
}

// This is a server-side rendered page for maximum compatibility.
// It fetches the pre-processed data and renders simple HTML.
export default async function TvDisplayPage() {
  const { data: displayData, publishedDate } = await getPublishedData();

  return (
    <>
      <style>{`
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
        }
        body { 
          background-color: hsl(var(--primary)); 
          color: hsl(var(--foreground));
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
          margin: 0;
          padding: 2rem;
          height: 100vh;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }
        header { text-align: center; margin-bottom: 2rem; color: hsl(var(--foreground)); flex-shrink: 0; }
        header h1 { font-size: 4rem; font-weight: 800; margin: 0; display: flex; align-items: center; justify-content: center; gap: 1.5rem; }
        header p { font-size: 2.5rem; margin: 0.5rem 0 0 0; opacity: 0.9; }
        main { flex: 1; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; overflow: hidden; }
        .card { background-color: hsla(var(--card), 0.8); border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid hsl(var(--border) / 0.7); border-left: 8px solid hsl(var(--primary)); }
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
        .no-classes-card { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 1rem; color: hsl(var(--foreground)); }
        .no-classes-card .icon-large { width: 8rem; height: 8rem; color: hsl(var(--accent)); margin-bottom: 1.5rem; }
        .no-classes-title { font-size: 3rem; font-weight: 600; }
        .no-classes-subtitle { font-size: 1.75rem; opacity: 0.8; margin-top: 0.5rem; }
      `}</style>
      <ClientRefresher />
      <header>
        <h1>
          <MonitorPlay style={{width:'4.5rem', height:'4.5rem'}} />
          Guia de Salas
        </h1>
        <p>{publishedDate}</p>
      </header>
      <main>
        {displayData && displayData.length > 0 ? (
          displayData.map(item => (
            <div key={item.id} className="card">
              <div className="card-content">
                <h2 className="group-name">{item.groupName}</h2>
                <p className="shift-info">Turno: <span className="shift-value">{item.shift}</span></p>
              </div>
              <div className="classroom-info">
                {item.classroomName ? (
                  <div className="classroom-details">
                    <DoorOpen className="icon" />
                    <div>
                      <p className="classroom-label">Sala</p>
                      <p className="classroom-name">{item.classroomName}</p>
                    </div>
                  </div>
                ) : (
                  <div className="classroom-details unavailable">
                    <AlertTriangle className="icon" />
                    <div>
                      <p className="classroom-label">Sala</p>
                      <p className={cn("classroom-name", "text-destructive")}>Não Atribuída</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-classes-card">
            <AlertTriangle className="icon-large" />
            <p className="no-classes-title">Nenhuma turma em andamento.</p>
            <p className="no-classes-subtitle">Verifique novamente mais tarde ou publique os dados.</p>
          </div>
        )}
      </main>
    </>
  );
}
