/**
 * @file src/app/tv-display/page.tsx
 * @description Esta é a página principal do painel de TV. É um Componente de Servidor React (RSC)
 *              que agora apresenta um mecanismo de carregamento robusto e adaptável aos dados.
 */
import { readData } from '@/lib/data-utils';
import type { ClassGroup, Classroom, TvDisplayInfo, ClassGroupStatus, Announcement } from '@/types';
import TvDisplayClient from '@/components/tv-display/TvDisplayClient';
import './tv-display.css';
import ClientRefresher from '@/components/tv-display/ClientRefresher';

interface TvDisplayInfoWithStatus extends TvDisplayInfo {
  status: ClassGroupStatus;
}

/**
 * Uma função assíncrona do lado do servidor para buscar e processar dados para o painel de TV.
 * Esta função foi completamente refatorada para ser adaptável aos dados. Ela ajusta dinamicamente
 * o ano das datas dos grupos de turmas para corresponder ao ano atual, tornando os dados sempre relevantes.
 *
 * @returns {Promise<{ data: TvDisplayInfoWithStatus[], announcements: Announcement[], lastPublished: string }>}
 *          Um objeto contendo a lista processada de grupos de turmas, anúncios e um timestamp.
 */
async function getTvDisplayData() {
  const [classGroups, classrooms, announcements] = await Promise.all([
    readData<ClassGroup>('classgroups.json'),
    readData<Classroom>('classrooms.json'),
    readData<Announcement>('announcements.json'),
  ]);

  const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));
  const currentYear = new Date().getFullYear();

  // Este é o núcleo da nova lógica robusta.
  // Processamos cada grupo de turma para garantir que as suas datas sejam relevantes para o ano atual.
  const adaptedClassGroups = classGroups.map(cg => {
    try {
      // Cria novos objetos Date a partir das datas de início e fim originais.
      const startDate = new Date(cg.startDate);
      const endDate = new Date(cg.endDate);

      // Define dinamicamente o ano das datas de início e fim para o ano corrente.
      // Isto torna os dados de demonstração intemporais e resolve a causa raiz do problema de exibição.
      startDate.setFullYear(currentYear);
      endDate.setFullYear(currentYear);

      // Retorna um novo objeto com as datas atualizadas e "vivas".
      return {
        ...cg,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
    } catch (e) {
      console.warn(`[TV Display] Data inválida para a turma ${cg.id}. A saltar.`);
      return null;
    }
  }).filter((cg): cg is ClassGroup => cg !== null); // Filtra quaisquer turmas com datas inválidas.

  const tvData: TvDisplayInfoWithStatus[] = adaptedClassGroups
    .map(cg => ({
      id: cg.id,
      groupName: cg.name,
      shift: cg.shift,
      classroomName: cg.assignedClassroomId ? (classroomMap.get(cg.assignedClassroomId) ?? 'Não Atribuída') : 'Não Atribuída',
      classDays: cg.classDays,
      startDate: cg.startDate,
      endDate: cg.endDate,
      status: cg.status,
    }))
    .sort((a, b) => ((a.classroomName ?? 'Z') > (b.classroomName ?? 'Z') ? 1 : -1));

  const publishedAnnouncements = announcements.filter(a => a.published);

  return {
    data: tvData,
    announcements: publishedAnnouncements,
    lastPublished: new Date().toISOString(),
  };
}

/**
 * O componente principal para a rota `/tv-display`. Ele busca dados adaptados ao tempo no servidor
 * e os passa para o cliente para renderização.
 */
export default async function TvDisplayPage() {
    const { data, announcements, lastPublished } = await getTvDisplayData();

    return (
        <>
            <ClientRefresher />
            <TvDisplayClient allGroups={data} announcements={announcements} lastPublished={lastPublished} />
        </>
    );
}
