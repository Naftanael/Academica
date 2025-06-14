
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DoorOpen, MonitorPlay, AlertTriangle, WifiOff } from 'lucide-react'; // Added WifiOff
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
const LOCAL_STORAGE_KEY = 'tvDisplayData';
const DATA_CHECK_INTERVAL = 3 * 60 * 1000; // 3 minutes
const RETRY_INTERVAL = 30 * 1000; // 30 seconds
const PAGE_RELOAD_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

interface DataStatus {
  classGroupsMtime: number | null;
  classroomsMtime: number | null;
}

const getCourseLeftBorderColorClass = (groupName: string): string => {
  const prefixMatch = groupName.match(/^([A-Z]+)/);
  const prefix = prefixMatch ? prefixMatch[1] : 'DEFAULT';

  // These classes should work well with dark theme due to dark: variants in globals.css or direct color values
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
  const [lastDataStatus, setLastDataStatus] = React.useState<DataStatus | null>(null);
  const [isOffline, setIsOffline] = React.useState<boolean>(false);
  const [usingLocalStorageData, setUsingLocalStorageData] = React.useState<boolean>(false);
  const retryTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Clock and periodic page reload
  React.useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setLiveCurrentTime(format(now, "HH:mm", { locale: ptBR }));
      setLiveCurrentDateHeader(format(now, "EEEE, dd 'de' MMMM", { locale: ptBR }));
    };
    
    updateDateTime();
    const clockIntervalId = setInterval(updateDateTime, 1000);
    
    const pageReloadTimer = setTimeout(() => {
      window.location.reload();
    }, PAGE_RELOAD_INTERVAL);

    return () => {
      clearInterval(clockIntervalId);
      clearTimeout(pageReloadTimer);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // localStorage functions
  const saveToLocalStorage = (data: TvDisplayInfo[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("TV Display: Error saving data to localStorage", error);
    }
  };

  const loadFromLocalStorage = (): TvDisplayInfo[] | null => {
    try {
      const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      console.error("TV Display: Error loading data from localStorage", error);
      return null;
    }
  };
  
  // Data fetching and status checking
  const checkDataChanges = React.useCallback(async () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    try {
      const response = await fetch('/api/data-status');
      if (!response.ok) {
        throw new Error(`Failed to fetch data status: ${response.statusText}`);
      }
      const currentDataStatus: DataStatus = await response.json();
      setIsOffline(false); // Connection successful

      if (lastDataStatus) {
        if (
          currentDataStatus.classGroupsMtime !== lastDataStatus.classGroupsMtime ||
          currentDataStatus.classroomsMtime !== lastDataStatus.classroomsMtime
        ) {
          router.refresh(); // Data has changed, refresh the page data
        }
      }
      setLastDataStatus(currentDataStatus);
    } catch (error) {
      console.error('TV Display: Error fetching data status -', error);
      setIsOffline(true);
      // Schedule a retry
      retryTimeoutRef.current = setTimeout(checkDataChanges, RETRY_INTERVAL);
    }
  }, [router, lastDataStatus]);

  React.useEffect(() => {
    checkDataChanges(); // Initial check
    const dataCheckIntervalId = setInterval(checkDataChanges, DATA_CHECK_INTERVAL);
    return () => clearInterval(dataCheckIntervalId);
  }, [checkDataChanges]);

  // Effect to handle initial data and localStorage fallback
  React.useEffect(() => {
    if (initialDisplayData && initialDisplayData.length > 0) {
      setDisplayData(initialDisplayData);
      saveToLocalStorage(initialDisplayData);
      setUsingLocalStorageData(false);
    } else {
      const cachedData = loadFromLocalStorage();
      if (cachedData && cachedData.length > 0) {
        setDisplayData(cachedData);
        setUsingLocalStorageData(true);
      } else {
        setDisplayData([]); // Ensure it's an empty array if nothing to show
        setUsingLocalStorageData(false);
      }
    }
  }, [initialDisplayData]);


  return (
    <div className="flex-grow w-full flex flex-col p-6 md:p-10">
      <header className="mb-10 text-center">
        <div className="flex items-center justify-center mb-3">
          <MonitorPlay className="w-16 h-16 md:w-20 md:h-20 text-primary mr-4" />
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground font-headline">
            Guia de Salas
          </h1>
        </div>
        <p className="text-2xl md:text-3xl text-muted-foreground">
          {liveCurrentDateHeader} - <span className="font-semibold text-foreground">{liveCurrentTime}</span>
        </p>
      </header>

      {isOffline && (
        <div className="my-4 p-4 bg-destructive/20 text-destructive-foreground border border-destructive rounded-md text-center flex items-center justify-center gap-2">
          <WifiOff className="w-6 h-6" />
          Sem conexão com o servidor. Tentando novamente em {RETRY_INTERVAL / 1000} segundos...
        </div>
      )}
      {usingLocalStorageData && !isOffline && (
         <div className="my-4 p-3 bg-accent/20 text-accent-foreground border border-accent rounded-md text-center">
          Exibindo últimos dados salvos (offline). A aplicação tentará atualizar em breve.
        </div>
      )}

      {displayData.length === 0 && !usingLocalStorageData ? (
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
                "bg-card rounded-xl shadow-lg p-6 md:p-8 flex flex-col justify-between border border-border border-l-[8px]", // Thicker border
                getCourseLeftBorderColorClass(item.groupName)
              )}
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-3 truncate font-headline" title={item.groupName}>
                  {item.groupName}
                </h2>
                <p className="text-2xl md:text-3xl text-muted-foreground mb-4">
                  Turno: <span className="font-semibold text-foreground">{item.shift}</span>
                </p>
              </div>
              <div className="mt-auto pt-4 border-t border-border/50">
                {item.classroomName ? (
                  <div className="flex items-center">
                    <DoorOpen className="w-12 h-12 md:w-14 md:h-14 text-accent mr-4 shrink-0" />
                    <div>
                      <p className="text-lg text-muted-foreground uppercase tracking-wider">Sala Atual</p>
                      <p className="text-3xl md:text-4xl font-semibold text-foreground truncate" title={item.classroomName}>
                        {item.classroomName}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                     <AlertTriangle className="w-12 h-12 md:w-14 md:h-14 text-destructive mr-4 shrink-0" />
                     <div>
                        <p className="text-lg text-muted-foreground uppercase tracking-wider">Sala</p>
                        <p className="text-3xl md:text-4xl font-semibold text-destructive">
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
       <footer className="mt-12 text-center text-base md:text-lg text-muted-foreground">
        {isOffline 
          ? `Tentando reconectar... Horário atual: ${liveCurrentTime}.`
          : usingLocalStorageData 
            ? `Exibindo dados em cache. Tentando atualizar. Horário: ${liveCurrentTime}.`
            : `Verificando atualizações periodicamente. Horário atual: ${liveCurrentTime}.`}
      </footer>
    </div>
  );
}
