
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MonitorPlay, AlertTriangle, WifiOff } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TvDisplayInfo } from '@/types';
import TvDisplayCard from './TvDisplayCard';

const PLACEHOLDER_DATE = "Carregando data...";
const DATA_CHECK_INTERVAL = 15 * 1000; // Check every 15 seconds for faster updates
const RETRY_INTERVAL = 30 * 1000; // 30 seconds
const PAGE_RELOAD_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

// The status the TV client expects from the new /api/tv-status endpoint
interface TvStatus {
  lastPublished: number | null;
}

interface TvDisplayClientProps {
  initialDisplayData: TvDisplayInfo[];
}

export default function TvDisplayClient({ initialDisplayData }: TvDisplayClientProps) {
  const router = useRouter();
  const [displayData, setDisplayData] = React.useState<TvDisplayInfo[]>(initialDisplayData);
  const [liveCurrentDateHeader, setLiveCurrentDateHeader] = React.useState<string>(PLACEHOLDER_DATE);
  const [lastPublished, setLastPublished] = React.useState<number | null>(null);
  const [isOffline, setIsOffline] = React.useState<boolean>(false);
  const retryTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const checkDataChanges = React.useCallback(async function checkDataChanges() {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    try {
      // Fetch from the new on-demand status endpoint
      const response = await fetch('/api/tv-status');
      if (!response.ok) {
        throw new Error('Failed to fetch data status: ' + response.statusText);
      }
      const currentStatus: TvStatus = await response.json();
      setIsOffline(false);

      // Initialize lastPublished on first successful fetch
      if (lastPublished === null) {
        setLastPublished(currentStatus.lastPublished);
        return;
      }

      // If the published timestamp has changed, refresh the page data
      if (currentStatus.lastPublished !== lastPublished) {
        setLastPublished(currentStatus.lastPublished);
        router.refresh(); 
      }
    } catch (error) {
      console.error('TV Display: Error fetching data status -', error);
      setIsOffline(true);
      // Retry on failure
      retryTimeoutRef.current = setTimeout(checkDataChanges, RETRY_INTERVAL);
    }
  }, [router, lastPublished]);


  React.useEffect(function mountAndIntervalEffects() {
    // --- Static timers and UI updates that don't depend on polling ---
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

    // --- Polling logic ---
    // Initial data check and start polling
    checkDataChanges(); 
    const dataCheckIntervalId = setInterval(checkDataChanges, DATA_CHECK_INTERVAL);

    // --- Cleanup ---
    return function cleanup() {
      clearTimeout(pageReloadTimer);
      clearInterval(dataCheckIntervalId);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [checkDataChanges]);

  // Update display data whenever server props change (after a router.refresh())
  React.useEffect(function updateDisplayData() {
    setDisplayData(initialDisplayData);
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
        <p className="text-3xl sm:text-4xl md:text-5xl text-primary-foreground">
          {liveCurrentDateHeader}
        </p>
      </header>

      {isOffline && (
        <div className="my-3 sm:my-4 p-3 sm:p-4 bg-destructive/20 text-destructive-foreground border border-destructive rounded-md text-center flex items-center justify-center gap-2 text-lg sm:text-xl md:text-2xl">
          <WifiOff className="w-6 h-6 sm:w-8 sm:h-8" />
          Sem conexão com o servidor. Tentando novamente...
        </div>
      )}

      {displayData.length === 0 ? (
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
          {displayData.map(function(item, index) {
             return <TvDisplayCard key={item.id} item={item} index={index} />;
          })}
        </main>
      )}
       <footer className="mt-8 sm:mt-12 text-center text-lg sm:text-xl text-primary-foreground/70">
        {isOffline 
          ? 'Tentando reconectar...'
          : 'Painel atualizado. Aguardando novas publicações.'}
      </footer>
    </div>
  );
}
