
import { Announcement } from '@/types';

interface AnnouncementsTickerProps {
  announcements: Announcement[];
}

export default function AnnouncementsTicker({ announcements }: AnnouncementsTickerProps) {
    // Verificação robusta: Se a matriz de anúncios for nula, indefinida ou vazia,
    // o componente não renderiza nada, evitando erros.
    if (!announcements || !announcements.length) {
        return null;
    }

  return (
    <div className="announcements-ticker-container">
      <div className="announcements-ticker">
        {/* O dobro do conteúdo é renderizado para garantir um loop contínuo e suave da animação do letreiro. */}
        {[...announcements, ...announcements].map((announcement, index) => (
          <div key={`${announcement.id}-${index}`} className="announcement-item">
            <span className={`priority-${announcement.priority.toLowerCase()}`}>{announcement.priority}</span>
            <span className="title">{announcement.title}</span>
            <span className="content">{announcement.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
