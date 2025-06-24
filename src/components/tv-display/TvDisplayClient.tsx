'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MonitorPlay, AlertTriangle, WifiOff } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TvDisplayInfo } from '@/types';
import TvDisplayCard from './TvDisplayCard';

const PLACEHOLDER_DATE = "Carregando data...";
const LOCAL_STORAGE_KEY = 'tvDisplayData';
const DATA_CHECK_INTERVAL = 3 * 60 * 1000; // 3 minutes
const RETRY_INTERVAL = 30 * 1000; // 30 seconds
const PAGE_RELOAD_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

interface DataStatus {
  classGroupsMtime: number | null;
  classroomsMtime: number | null;
}

interface TvDisplayClientProps {
  initialDisplayData: TvDisplayInfo[];
}

export default function TvDisplayClient({ initialDisplayData }: TvDisplayClientProps) {
  const router = useRouter();
  const [displayData, setDisplayData] = React.useState<TvDisplayInfo[]>(initialDisplayData);
  const [liveCurrentDateHeader, setLiveCurrentDateHeader] = React.useState<string>(PLACEHOLDER_DATE);
  const [lastDataStatus, setLastDataStatus] = React.useState<DataStatus | null>(null);
  const [isOffline, setIsOffline] = React.useState<boolean>(false);
  const [usingLocalStorageData, setUsingLocalStorageData] = React.useState<boolean>(false);
  const retryTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const updateDateHeader = () => {
      const now = new Date();
      setLiveCurrentDateHeader(format(now, "EEEE, dd 'de' MMMM", { locale: ptBR }));
    };
    
    updateDateHeader(); // Set date on mount
    
    const pageReloadTimer = setTimeout(() => {
      window.location.reload();
    }, PAGE_RELOAD_INTERVAL);

    // Cleanup all timers on component unmount
    return () => {
      clearTimeout(pageReloadTimer);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

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
    } catch (error)      {
      console.error("TV Display: Error loading data from localStorage", error);
      return null;
    }
  };
  
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
      setIsOffline(false);

      if (lastDataStatus) {
        if (
          currentDataStatus.classGroupsMtime !== lastDataStatus.classGroupsMtime ||
          currentDataStatus.classroomsMtime !== lastDataStatus.classroomsMtime
        ) {
          router.refresh(); 
        }
      }
      setLastDataStatus(currentDataStatus);
    } catch (error) {
      console.error('TV Display: Error fetching data status -', error);
      setIsOffline(true);
      retryTimeoutRef.current = setTimeout(checkDataChanges, RETRY_INTERVAL);
    }
  }, [router, lastDataStatus]);

  React.useEffect(() => {
    checkDataChanges(); 
    const dataCheckIntervalId = setInterval(checkDataChanges, DATA_CHECK_INTERVAL);
    return () => clearInterval(dataCheckIntervalId);
  }, [checkDataChanges]);

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
        setDisplayData([]);
        setUsingLocalStorageData(false);
      }
    }
  }, [initialDisplayData]);


  return (
    <div className="flex-grow w-full flex flex-col p-4 sm:p-6 md:p-8 xl:p-10">
      <header className="mb-8 md:mb-12 text-center">
        <div className="flex items-center justify-center mb-3 sm:mb-4">
          <MonitorPlay className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-primary-foreground mr-3 sm:mr-4" />
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight font-headline">
            Guia de Salas
          </h1>
        </div>
        <p className="text-3xl sm:text-4xl md:text-5xl text-primary-foreground/90">
          {liveCurrentDateHeader}
        </p>
      </header>

      {isOffline && (
        <div className="my-3 sm:my-4 p-3 sm:p-4 bg-destructive/20 text-destructive-foreground border border-destructive rounded-md text-center flex items-center justify-center gap-2 text-lg sm:text-xl md:text-2xl">
          <WifiOff className="w-6 h-6 sm:w-8 sm:h-8" />
          Sem conexão com o servidor. Tentando novamente...
        </div>
      )}
      {usingLocalStorageData && !isOffline && (
         <div className="my-3 sm:my-4 p-3 bg-accent/20 text-accent-foreground border border-accent rounded-md text-center text-lg sm:text-xl md:text-2xl">
          Exibindo últimos dados salvos. A aplicação tentará atualizar em breve.
        </div>
      )}

      {displayData.length === 0 && !usingLocalStorageData ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
          <AlertTriangle className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 text-accent mb-6 sm:mb-8" />
          <p className="text-4xl sm:text-5xl md:text-6xl font-semibold">
            Nenhuma turma em andamento.
          </p>
          <p className="text-2xl sm:text-3xl md:text-4xl text-primary-foreground/80 mt-3 sm:mt-4">
            Verifique novamente mais tarde.
          </p>
        </div>
      ) : (
        <main className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {displayData.map((item, index) => (
             <TvDisplayCard key={item.id} item={item} index={index} />
          ))}
        </main>
      )}
       <footer className="mt-8 sm:mt-12 text-center text-lg sm:text-xl text-primary-foreground/70">
        {isOffline 
          ? `Tentando reconectar...`
          : usingLocalStorageData 
            ? `Dados em cache. Tentando atualizar.`
            : `Verificando atualizações...`}
      </footer>
    </div>
  );
}
