/**
 * @file src/components/tv-display/TvDisplayClient.tsx
 * @description Componente cliente para o painel de TV. Ele lida com a filtragem em tempo real e a exibição dos grupos de turmas.
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { filterActiveGroups, ClientTvDisplayInfo } from '@/lib/tv-display-utils';
import TvCard from '@/components/tv-display/TvCard';
import NoClassesMessage from '@/components/tv-display/NoClassesMessage';
import LastUpdated from '@/components/tv-display/LastUpdated';
import AnnouncementsTicker from './AnnouncementsTicker';
import type { Announcement } from '@/types';

interface TvDisplayClientProps {
  allGroups: ClientTvDisplayInfo[];
  announcements: Announcement[];
  lastPublished: string;
}

/**
 * Um hook personalizado para percorrer os anúncios.
 * @param {Announcement[]} announcements - A lista de anúncios a serem exibidos.
 * @param {number} interval - O tempo em milissegundos para exibir cada anúncio.
 * @returns {Announcement[]} A lista de anúncios a serem exibidos no momento (geralmente um de cada vez).
 */
const useAnnouncements = (announcements: Announcement[], interval = 10000) => {
    const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);

    useEffect(() => {
        // A verificação robusta garante que o código não falhe se os anúncios forem nulos ou vazios.
        if (!announcements || announcements.length <= 1) {
            return;
        }
        
        const announcementInterval = setInterval(() => {
            setCurrentAnnouncementIndex((prevIndex) => (prevIndex + 1) % announcements.length);
        }, interval);

        return () => clearInterval(announcementInterval);
    }, [announcements, interval]);

    const visibleAnnouncements = useMemo(() => {
        if (!announcements || !announcements.length) return [];
        // A animação de "ticker" pode lidar com múltiplos itens, então vamos fornecer todos e deixar o CSS cuidar disso.
        return announcements;
    }, [announcements]);

    return visibleAnnouncements;
};


/**
 * Renderiza o ecrã principal da TV, filtrando e mostrando os grupos de turmas ativos com base na hora atual.
 * Este componente é responsável pelas interações do lado do cliente, como a atualização da hora a cada minuto.
 *
 * @param {TvDisplayClientProps} props - As props para o componente.
 * @returns {JSX.Element} A interface do painel de TV renderizada.
 */
export default function TvDisplayClient({ allGroups, announcements, lastPublished }: TvDisplayClientProps): JSX.Element {
  // O estado `currentTime` é inicializado como nulo no servidor e definido no cliente.
  // Isto evita erros de hidratação do React.
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const visibleAnnouncements = useAnnouncements(announcements);

  // O `useEffect` só é executado no cliente.
  // Ele define a hora atual e, em seguida, configura um intervalo para atualizá-la a cada minuto.
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 60000); // Atualiza a cada minuto.
    return () => clearInterval(interval);
  }, []);

  // Filtra os grupos ativos com base na hora atual.
  // `useMemo` garante que esta filtragem dispendiosa só seja executada quando os dados ou a hora mudam.
  const activeGroups = useMemo(() => {
    // Se a hora atual ainda não foi definida, não exibe nenhum grupo.
    if (currentTime === null) {
      return [];
    }
    // A lógica de filtragem principal é delegada a uma função de utilitário robusta.
    return filterActiveGroups(allGroups, currentTime);
  }, [allGroups, currentTime]);

  return (
    <>
      <header>
        <h1>Guia de Salas</h1>
        <LastUpdated lastPublished={lastPublished} />
      </header>
      <main className="cards-container">
        {activeGroups.length > 0 ? (
          activeGroups.map(group => <TvCard key={group.id} item={group} />)
        ) : (
          <NoClassesMessage />
        )}
      </main>
      <AnnouncementsTicker announcements={visibleAnnouncements} />
    </>
  );
}
