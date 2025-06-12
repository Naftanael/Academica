
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms';
import type { ClassGroup, Classroom } from '@/types';
import { DoorOpen, MonitorPlay, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TvDisplayInfo {
  id: string;
  groupName: string;
  shift: string;
  classroomName: string | null;
}

export default async function TvDisplayPage() {
  const classGroups = await getClassGroups();
  const classrooms = await getClassrooms();

  const activeClassGroups = classGroups.filter(cg => cg.status === 'Em Andamento');

  const displayData: TvDisplayInfo[] = activeClassGroups.map(group => {
    const classroom = classrooms.find(room => room.id === group.assignedClassroomId);
    return {
      id: group.id,
      groupName: group.name,
      shift: group.shift,
      classroomName: classroom ? classroom.name : null,
    };
  });

  const currentTime = format(new Date(), "HH:mm", { locale: ptBR });
  const currentDate = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });


  return (
    <div className="min-h-screen w-full flex flex-col p-4 md:p-8 selection:bg-blue-500 selection:text-white">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center mb-2">
          <MonitorPlay className="w-12 h-12 md:w-16 md:h-16 text-blue-400 mr-4" />
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
            Painel de Turmas
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-gray-300">
          {currentDate} - <span className="font-semibold">{currentTime}</span>
        </p>
      </header>

      {displayData.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-24 h-24 text-yellow-400 mb-6" />
          <p className="text-3xl md:text-4xl font-semibold text-gray-200">
            Nenhuma turma em andamento no momento.
          </p>
          <p className="text-lg md:text-xl text-gray-400 mt-2">
            Verifique novamente mais tarde.
          </p>
        </div>
      ) : (
        <main className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {displayData.map(item => (
            <div
              key={item.id}
              className="bg-gray-800 rounded-xl shadow-2xl p-6 flex flex-col justify-between transform hover:scale-105 transition-transform duration-300 ease-in-out border border-gray-700"
            >
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-blue-300 mb-3 truncate" title={item.groupName}>
                  {item.groupName}
                </h2>
                <p className="text-lg md:text-xl text-gray-400 mb-4">
                  Turno: <span className="font-semibold text-gray-200">{item.shift}</span>
                </p>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-700">
                {item.classroomName ? (
                  <div className="flex items-center">
                    <DoorOpen className="w-10 h-10 md:w-12 md:h-12 text-green-400 mr-3 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">SALA ATUAL</p>
                      <p className="text-2xl md:text-3xl font-semibold text-green-300 truncate" title={item.classroomName}>
                        {item.classroomName}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                     <AlertTriangle className="w-10 h-10 md:w-12 md:h-12 text-yellow-400 mr-3 shrink-0" />
                     <div>
                        <p className="text-sm text-gray-500">SALA</p>
                        <p className="text-2xl md:text-3xl font-semibold text-yellow-300">
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
       <footer className="mt-12 text-center text-sm text-gray-500">
        Atualiza automaticamente a cada 5 minutos. Última atualização: {currentTime}.
      </footer>
    </div>
  );
}
