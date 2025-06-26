
import { readData } from '@/lib/data-utils';
import { Clock, Building, AlertTriangle } from 'lucide-react';
import type { ClassGroup, Classroom, TvDisplayInfo } from '@/types';
import ClientRefresher from '@/components/tv-display/ClientRefresher';
import { getCurrentShift } from '@/lib/utils';

// Helper to generate the card for a single class
const TvCard = ({ item }: { item: TvDisplayInfo }) => {
  return (
    <div className="card bg-[#1b263b] rounded-lg shadow-lg p-4 flex flex-col justify-between border border-[#415a77] border-l-8 border-l-[#778da9]">
      <div className="card-content flex-grow mb-2">
        <h2 className="group-name text-4xl font-bold text-[#e0e1dd] break-words">{item.groupName}</h2>
        <p className="shift-info text-2xl text-[#e0e1dd]/70">Turno: <span className="font-semibold text-[#e0e1dd]">{item.shift}</span></p>
      </div>
      <div className="classroom-info mt-auto pt-3 border-t border-t-[#415a77]">
        {item.classroomName ? (
          <div className="classroom-details flex items-center gap-4">
            <Building className="h-14 w-14 text-[#778da9] shrink-0" />
            <div>
              <p className="classroom-label text-xl uppercase tracking-wider text-[#e0e1dd]/70">Sala</p>
              <p className="classroom-name text-3xl font-semibold text-[#e0e1dd] break-words">{item.classroomName}</p>
            </div>
          </div>
        ) : (
          <div className="classroom-details unavailable flex items-center gap-4">
            <AlertTriangle className="h-14 w-14 text-[#e53d3d] shrink-0" />
            <div>
              <p className="classroom-label text-xl uppercase tracking-wider text-[#e0e1dd]/70">Sala</p>
              <p className="classroom-name text-3xl font-semibold text-[#e53d3d]">Não Atribuída</p>
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
    <div className="no-classes-card col-span-full flex flex-col items-center justify-center text-center p-4 text-[#e0e1dd]">
      <AlertTriangle className="h-32 w-32 text-[#778da9] mb-6" />
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
    <div className="bg-[#0d1b2a] text-[#e0e1dd] font-body p-8 min-h-screen w-full flex flex-col">
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
