
import { readData } from '@/lib/data-utils';
import { Clock, Building, AlertTriangle } from 'lucide-react';
import type { ClassGroup, Classroom, TvDisplayInfo } from '@/types';
import ClientRefresher from '@/components/tv-display/ClientRefresher';
import { getCurrentShift } from '@/lib/utils';

// Helper to generate the card for a single class
const getCourseStyle = (groupName: string) => {
  const course = groupName.split(' ')[0];
  switch (course) {
    case 'FMC':
      return { bgColor: 'bg-blue-900', borderColor: 'border-l-blue-400' };
    case 'RAD':
      return { bgColor: 'bg-purple-900', borderColor: 'border-l-purple-400' };
    case 'ENF':
      return { bgColor: 'bg-teal-900', borderColor: 'border-l-teal-400' };
    case 'ADM':
        return { bgColor: 'bg-amber-900', borderColor: 'border-l-amber-400' };
    default:
      return { bgColor: 'bg-gray-900', borderColor: 'border-l-gray-400' };
  }
};

const TvCard = ({ item }: { item: TvDisplayInfo }) => {
    const { bgColor, borderColor } = getCourseStyle(item.groupName);
    return (
      <div className={`card ${bgColor} rounded-lg shadow-lg p-4 flex flex-col justify-between border border-gray-700 border-l-8 ${borderColor}`}>
        <div className="card-content flex-grow mb-2">
          <h2 className="group-name text-4xl font-bold text-white break-words">{item.groupName}</h2>
          <p className="shift-info text-2xl text-gray-300">Turno: <span className="font-semibold text-white">{item.shift}</span></p>
        </div>
        <div className="classroom-info mt-auto pt-3 border-t border-gray-700">
          {item.classroomName ? (
            <div className="classroom-details flex items-center gap-4">
              <Building className="h-14 w-14 text-gray-400 shrink-0" />
              <div>
                <p className="classroom-label text-xl uppercase tracking-wider text-gray-300">Sala</p>
                <p className="classroom-name text-3xl font-semibold text-white break-words">{item.classroomName}</p>
              </div>
            </div>
          ) : (
            <div className="classroom-details unavailable flex items-center gap-4">
              <AlertTriangle className="h-14 w-14 text-red-500 shrink-0" />
              <div>
                <p className="classroom-label text-xl uppercase tracking-wider text-gray-300">Sala</p>
                <p className="classroom-name text-3xl font-semibold text-red-500">Não Atribuída</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
// Helper for the "no classes" message
const NoClassesMessage = () => {
  return (
    <div className="no-classes-card col-span-full flex flex-col items-center justify-center text-center p-4 text-white">
      <AlertTriangle className="h-32 w-32 text-gray-500 mb-6" />
      <p className="no-classes-title text-5xl font-semibold">Nenhuma turma em andamento.</p>
      <p className="no-classes-subtitle text-3xl opacity-80 mt-2">O painel é atualizado automaticamente.</p>
    </div>
  );
};


export default async function TvDisplayPage() {
  const classGroups = await readData<ClassGroup>('classgroups.json');
  const classrooms = await readData<Classroom>('classrooms.json');

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
  
  const lastUpdated = now.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return (
    <div className="bg-green-950 text-white font-body p-8 min-h-screen w-full flex flex-col">
      <ClientRefresher />
      <header className="text-center mb-8 shrink-0">
        <h1 className="text-7xl font-extrabold flex items-center justify-center gap-6">
          <Clock className="w-20 h-20" />
          Guia de Salas
        </h1>
        <p className="text-4xl mt-2 opacity-90">{lastUpdated}</p>
      </header>
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-hidden">
        {displayData.length > 0 ? (
          displayData.map(item => <TvCard key={item.id} item={item} />)
        ) : (
          <NoClassesMessage />
        )}
      </main>
    </div>
  );
}

