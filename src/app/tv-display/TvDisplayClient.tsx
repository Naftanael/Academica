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
  const [liveCurrentDateHeader, setLiveCurrentDateHeader] = React.useState<string>(PLACEHOLDER_DATE);
  const [lastDataStatus, setLastDataStatus] = React.useState<DataStatus | null>(null);
  const [isOffline, setIsOffline] = React.useState<boolean>(false);
  const retryTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const checkDataChanges = React.useCallback(async function checkDataChanges() {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    try {
      const response = await fetch('/api/data-status');
      if (!response.ok) {
        throw new Error('Failed to fetch data status: ' + response.statusText);
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

  React.useEffect(function mountEffects() {
    function updateDateHeader() {
      const now = new Date();
      setLiveCurrentDateHeader(format(now, "EEEE, dd 'de' MMMM", { locale: ptBR }));
    };
    
    updateDateHeader();
    
    const pageReloadTimer = setTimeout(function reloadPage() {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, PAGE_RELOAD_INTERVAL);

    // Initial data check and start polling
    checkDataChanges(); 
    const dataCheckIntervalId = setInterval(checkDataChanges, DATA_CHECK_INTERVAL);

    // Store initial data in localStorage for offline fallback
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialDisplayData));
      }
    } catch (error) {
      console.error("TV Display: Error saving data to localStorage", error);
    }

    return function cleanup() {
      clearTimeout(pageReloadTimer);
      clearInterval(dataCheckIntervalId);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [checkDataChanges, initialDisplayData]);
  
  return (
     <div className="flex flex-col w-full h-full p-4 overflow-hidden box-border">
      <header className="text-center shrink-0 mb-4">
        <div className="flex items-center justify-center mb-2">
          <MonitorPlay className="w-12 h-12 sm:w-16 sm:h-16 text-primary-foreground mr-3" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-headline">
            Guia de Salas
          </h1>
        </div>
        <p className="text-2xl sm:text-3xl text-primary-foreground">
          {liveCurrentDateHeader}
        </p>
      </header>
      
      {isOffline && (
        <div className="shrink-0 my-2 p-3 bg-destructive/20 text-destructive-foreground border border-destructive rounded-md text-center flex items-center justify-center gap-2 text-lg">
          <WifiOff className="w-6 h-6" />
          Sem conexão com o servidor. Tentando novamente...
        </div>
      )}

      <main className="flex-grow grid [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] gap-4 min-h-0">
          {initialDisplayData && initialDisplayData.length > 0 ? (
              initialDisplayData.map(function(item, index) {
                  return <TvDisplayCard key={item.id} item={item} index={index} />;
              })
          ) : (
              <div className="col-span-full flex-grow flex flex-col items-center justify-center text-center p-4">
                  <AlertTriangle className="w-28 h-28 text-accent mb-6" />
                  <p className="text-4xl font-semibold">
                      Nenhuma turma em andamento.
                  </p>
                  <p className="text-2xl text-primary-foreground/80 mt-3">
                      Verifique novamente mais tarde.
                  </p>
              </div>
          )}
      </main>
    </div>
  );
}
