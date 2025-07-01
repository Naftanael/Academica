
import type { TvDisplayInfo } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Obtém um prefixo de classe CSS consistente a partir do nome do grupo.
 * @param {string} groupName - O nome do grupo/turma.
 * @returns {string} Um prefixo de classe como 'fmc', 'rad', etc.
 */
const getCoursePrefix = (groupName: string): string => {
  const upperGroupName = groupName.toUpperCase();
  if (upperGroupName.startsWith('FMC')) return 'fmc';
  if (upperGroupName.startsWith('RAD')) return 'rad';
  if (upperGroupName.startsWith('ENF')) return 'enf';
  if (upperGroupName.startsWith('ADM')) return 'adm';
  return 'default';
};

export default function TvCard({ item }: { item: TvDisplayInfo }) {
  const courseClass = `card-${getCoursePrefix(item.groupName)}`;
  const isAssigned = item.classroomName !== 'Não Atribuída';

  return (
    <div className={cn('card', courseClass)}>
      <div className="card-title">{item.groupName}</div>
      <div className={cn('card-value', { 'not-assigned': !isAssigned })}>
        {item.classroomName}
      </div>
    </div>
  );
}
