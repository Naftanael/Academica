
import { Announcement } from '@/types';

interface AnnouncementsTickerProps {
  announcements: Announcement[];
}

export default function AnnouncementsTicker({ announcements }: AnnouncementsTickerProps) {
    if (!announcements.length) {
        return null;
    }

  return (
    <div className="announcements-ticker-container">
      <div className="announcements-ticker">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="announcement-item">
            <span className={`priority-${announcement.priority.toLowerCase()}`}>{announcement.priority}</span>
            <span className="title">{announcement.title}</span>
            <span className="content">{announcement.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
