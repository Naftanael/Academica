
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DoorOpen, MonitorPlay, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface TvDisplayInfo {
  id: string;
  groupName: string;
  shift: string;
  classroomName: string | null;
}

interface TvDisplayClientProps {
  initialDisplayData: TvDisplayInfo[];
  initialCurrentDateHeader: string;
  initialCurrentTime: string;
}

export default function TvDisplayClient({ initialDisplayData, initialCurrentDateHeader, initialCurrentTime }: TvDisplayClientProps) {
  const router = useRouter();
  const [displayData, setDisplayData] = React.useState<TvDisplayInfo[]>(initialDisplayData);
  const [liveCurrentTime, setLiveCurrentTime] = React.useState<string>(initialCurrentTime);
  const [liveCurrentDateHeader, setLiveCurrentDateHeader] = React.useState<string>(initialCurrentDateHeader);

  // Effect to refresh data every 10 seconds
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      router.refresh();
    }, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, [router]);

  // Effect to update the live clock every second
  React.useEffect(() => {
    const clockIntervalId = setInterval(() => {
      const now = new Date();
      setLiveCurrentTime(format(now, "HH:mm", { locale: ptBR }));
      setLiveCurrentDateHeader(format(now, "EEEE, dd 'de' MMMM", { locale: ptBR }));
    }, 1000); // 1 second

    return () => clearInterval(clockIntervalId);
  }, []);

  // Effect to update displayData when initialDisplayData prop changes
  React.useEffect(() => {
    setDisplayData(initialDisplayData);
  }, [initialDisplayData]);

  return (
    <div className="min-h-screen w-full flex flex-col p-6 md:p-10 selection:bg-blue-500 selection:text-white">
      <header className="mb-10 text-center">
        <div className="flex items-center justify-center mb-3">
          <MonitorPlay className="w-16 h-16 md:w-20 md:h-20 text-blue-400 mr-4" />
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white">
            Painel de Turmas
          </h1>
        </div>
        <p className="text-2xl md:text-3xl text-gray-300">
          {liveCurrentDateHeader} - <span className="font-semibold">{liveCurrentTime}</span>
        </p>
      </header>

      {displayData.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
          <AlertTriangle className="w-32 h-32 md:w-40 md:h-40 text-yellow-400 mb-8" />
          <p className="text-4xl md:text-5xl font-semibold text-gray-200">
            Nenhuma turma em andamento no momento.
          </p>
          <p className="text-xl md:text-2xl text-gray-400 mt-4">
            Verifique novamente mais tarde.
          </p>
        </div>
      ) : (
        <main className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {displayData.map(item => (
            <div
              key={item.id}
              className="bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 flex flex-col justify-between border border-gray-700 transition-transform duration-300 ease-in-out"
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-blue-300 mb-4 truncate" title={item.groupName}>
                  {item.groupName}
                </h2>
                <p className="text-xl md:text-2xl text-gray-400 mb-5">
                  Turno: <span className="font-semibold text-gray-200">{item.shift}</span>
                </p>
              </div>
              <div className="mt-auto pt-5 border-t border-gray-700">
                {item.classroomName ? (
                  <div className="flex items-center">
                    <DoorOpen className="w-12 h-12 md:w-16 md:h-16 text-green-400 mr-4 shrink-0" />
                    <div>
                      <p className="text-base text-gray-500 uppercase tracking-wider">Sala Atual</p>
                      <p className="text-3xl md:text-4xl font-semibold text-green-300 truncate" title={item.classroomName}>
                        {item.classroomName}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                     <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 text-yellow-400 mr-4 shrink-0" />
                     <div>
                        <p className="text-base text-gray-500 uppercase tracking-wider">Sala</p>
                        <p className="text-3xl md:text-4xl font-semibold text-yellow-300">
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
       <footer className="mt-12 text-center text-base md:text-lg text-gray-500">
        Atualiza automaticamente a cada 10 segundos. Última atualização: {liveCurrentTime}.
      </footer>
    </div>
  );
}
