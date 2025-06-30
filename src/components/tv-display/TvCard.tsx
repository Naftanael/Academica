
import type { TvDisplayInfo } from '@/types';

export default function TvCard({ item }: { item: TvDisplayInfo }) {
  const courseClass = `card-${item.groupName.split(' ')[0].toLowerCase()}`;

  return (
    <div className={`card ${courseClass}`}>
      <div className="card-title">{item.groupName}</div>
      <div className="card-value">{item.classroomName || 'Não Atribuída'}</div>
    </div>
  );
}
