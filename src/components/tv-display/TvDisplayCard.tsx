
import type { TvDisplayInfo } from '@/types';
import { cn } from '@/lib/utils';

// Helper to get a consistent color class from the group name for styling
const getCourseColorClass = (groupName: string) => {
  const upperCaseGroupName = groupName.toUpperCase();
  if (upperCaseGroupName.includes('FMC')) return 'bg-blue-200';
  if (upperCaseGroupName.includes('RAD')) return 'bg-green-200';
  if (upperCaseGroupName.includes('ENF')) return 'bg-red-200';
  if (upperCaseGroupName.includes('ADM')) return 'bg-yellow-200';
  return 'bg-gray-200';
};

export default function TvDisplayCard({ group }: { group: TvDisplayInfo }) {
  return (
    <div
      className={cn(
        'rounded-lg shadow-lg p-4 flex flex-col justify-between',
        getCourseColorClass(group.groupName)
      )}
    >
      <div className="text-xl font-bold text-gray-800 mb-2">{group.classroomName}</div>
      <div className="text-lg text-gray-700">{group.groupName}</div>
    </div>
  );
}
