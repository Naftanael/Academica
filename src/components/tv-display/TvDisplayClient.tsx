
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DoorOpen, MonitorPlay, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface TvDisplayInfo {
  id: string;
  groupName: string;
  shift: string;
  classroomName: string | null;
}

interface TvDisplayClientProps {
  initialDisplayData: TvDisplayInfo[];
}

const PLACEHOLDER_TIME = "--:--";
const PLACEHOLDER_DATE = "Carregando data...";

const getCourseLeftBorderColorClass = (groupName: string): string => {
  const prefixMatch = groupName.match(/^([A-Z]+)/);
  const prefix = prefixMatch ? prefixMatch[1] : 'DEFAULT';

  // Using theme-agnostic Tailwind colors or specific HSL if needed
  // For simplicity, let's use some direct Tailwind colors for borders.
  // These can be mapped to theme variables if more dynamic theming is needed.
  switch (prefix) {
    case 'ENF': return 'border-l-sky-500 dark:border-l-sky-400';
    case 'FMC': return 'border-l-amber-500 dark:border-l-amber-400';
    case 'RAD': return 'border-l-lime-500 dark:border-l-lime-400';
    case 'ADM': return 'border-l-purple-500 dark:border-l-purple-400';
    case 'CDI': return 'border-l-pink-500 dark:border-l-pink-400';
    default: return 'border-l-slate-500 dark:border-l-slate-400';
  }
};

export default function TvDisplayClient({ initialDisplayData }: TvDisplayClientProps) {
  const router = useRouter();
  const [displayData, setDisplayData] = React.useState<TvDisplayInfo[]>(initialDisplayData);
  const [liveCurrentTime, setLiveCurrentTime] = React.useState<string>(PLACEHOLDER_TIME);
  const [liveCurrentDateHeader, setLiveCurrentDateHeader] = React.useState<string>(PLACEHOLDER_DATE);

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      router.refresh();
    }, 10000); 

    return () => clearInterval(intervalId);
  }, [router]);

  React.useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setLiveCurrentTime(format(now, "HH:mm", { locale: ptBR }));
      setLiveCurrentDateHeader(format(now, "EEEE, dd 'de' MMMM", { locale: ptBR }));
    };
    
    updateDateTime(); 
    const clockIntervalId = setInterval(updateDateTime, 1000); 
    return () => clearInterval(clockIntervalId);
  }, []);

  React.useEffect(() => {
    setDisplayData(initialDisplayData);
  }, [initialDisplayData]);

  return (
    <div className="flex-grow w-full flex flex-col p-6 md:p-10">
      <header className="mb-10 text-center">
        <div className="flex items-center justify-center mb-3">
          <MonitorPlay className="w-16 h-16 md:w-20 md:h-20 text-primary mr-4" />
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground font-headline">
            Painel de Turmas
          </h1>
        </div>
        <p className="text-2xl md:text-3xl text-muted-foreground">
          {liveCurrentDateHeader} - <span className="font-semibold text-foreground">{liveCurrentTime}</span>
        </p>
      </header>

      {displayData.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
          <AlertTriangle className="w-32 h-32 md:w-40 md:h-40 text-accent mb-8" />
          <p className="text-4xl md:text-5xl font-semibold text-foreground">
            Nenhuma turma em andamento no momento.
          </p>
          <p className="text-xl md:text-2xl text-muted-foreground mt-4">
            Verifique novamente mais tarde.
          </p>
        </div>
      ) : (
        <main className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {displayData.map(item => (
            <div
              key={item.id}
              className={cn(
                "bg-card rounded-xl shadow-lg p-6 md:p-8 flex flex-col justify-between border border-border border-l-[6px]", 
                getCourseLeftBorderColorClass(item.groupName)
              )}
            >
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 truncate font-headline" title={item.groupName}>
                  {item.groupName}
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground mb-4">
                  Turno: <span className="font-semibold text-foreground">{item.shift}</span>
                </p>
              </div>
              <div className="mt-auto pt-4 border-t border-border/50">
                {item.classroomName ? (
                  <div className="flex items-center">
                    <DoorOpen className="w-10 h-10 md:w-12 md:h-12 text-accent mr-3 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">Sala Atual</p>
                      <p className="text-2xl md:text-3xl font-semibold text-foreground truncate" title={item.classroomName}>
                        {item.classroomName}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                     <AlertTriangle className="w-10 h-10 md:w-12 md:h-12 text-destructive mr-3 shrink-0" />
                     <div>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider">Sala</p>
                        <p className="text-2xl md:text-3xl font-semibold text-destructive">
                            Não definida
                        </p>
                     </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </main>
      )}
       <footer className="mt-12 text-center text-sm md:text-base text-muted-foreground">
        Atualiza automaticamente a cada 10 segundos. {liveCurrentTime !== PLACEHOLDER_TIME ? `Última atualização: ${liveCurrentTime}.` : 'Aguardando atualização...'}
      </footer>
    </div>
  );
}
