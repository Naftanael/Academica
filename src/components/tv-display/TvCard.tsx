
import type { TvDisplayInfo } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Generates a CSS class prefix from the course/class name.
 * This allows styling the cards differently based on the course type.
 * @param {string} groupName - The name of the group/class, ex: "FMC10".
 * @returns {string} A class prefix such as 'fmc', 'rad', 'enf', 'adm', or 'default'.
 */
const getCourseColorClass = (groupName: string): string => {
  if (!groupName) return 'bg-gray-500';
  const upperGroupName = groupName.toUpperCase();
  if (upperGroupName.startsWith('FMC')) return 'bg-yellow-500';
  if (upperGroupName.startsWith('RAD')) return 'bg-purple-500';
  if (upperGroupName.startsWith('ENF')) return 'bg-green-500';
  if (upperGroupName.startsWith('ADM')) return 'bg-blue-500';
  return 'bg-gray-500';
};

/**
 * Component that renders a single information card for the TV panel.
 * Its style (color, etc.) changes based on the course type and whether a room is assigned.
 * @param {{ item: TvDisplayInfo }} props - The component's properties, containing the class information.
 */
export default function TvCard({ item }: { item: TvDisplayInfo }) {
  const isAssigned = item.classroomName !== 'Não Atribuída';

  // Determines the card's color class based on the course.
  // If the room is not assigned, it uses a special 'unassigned' style.
  const cardColorClass = isAssigned
    ? getCourseColorClass(item.groupName)
    : 'bg-red-500';

  return (
    // The main card div, combining base and color classes.
    <div className={cn('card', cardColorClass)}>
      
      {/* Main content section of the card (grows to fill the space) */}
      <div className="flex-grow">
        <div className="card-title">{item.groupName}</div>
        <div className={cn('card-value', { 'not-assigned': !isAssigned })}>
          {item.classroomName}
        </div>
      </div>
    </div>
  );
}
