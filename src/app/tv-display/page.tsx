
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms';
import TvDisplayClient from '@/components/tv-display/TvDisplayClient';
import { TvDisplayInfo, ClassGroup, Classroom, ClassGroupStatus } from '@/types';
import { parseISO, isAfter, isBefore, isValid } from 'date-fns';

export default async function TvDisplayPage() {
    // Fetch all necessary data in parallel
    const [classGroups, classrooms] = await Promise.all([
        getClassGroups(),
        getClassrooms(),
    ]);

    // Create a map of classrooms for efficient lookup
    const classroomsMap = new Map<string, Classroom>();
    classrooms.forEach(c => classroomsMap.set(c.id, c));

    // Combine class group and classroom data
    const tvDisplayData: TvDisplayInfo[] = classGroups.map((cg: ClassGroup & { classroomName?: string }) => {
        const classroom = cg.assignedClassroomId ? classroomsMap.get(cg.assignedClassroomId) : undefined;
        
        // Safely determine the status of the class group
        let status: ClassGroupStatus = 'Planejada'; // Default status
        if (cg.startDate && cg.endDate) {
            const now = new Date();
            const startDate = parseISO(cg.startDate);
            const endDate = parseISO(cg.endDate);

            if (isValid(startDate) && isValid(endDate)) {
                if (isBefore(now, startDate)) {
                    status = 'Planejada';
                } else if (isAfter(now, endDate)) {
                    status = 'Concluída';
                } else {
                    status = 'Em Andamento';
                }
            }
        }

        return {
            id: cg.id,
            groupName: cg.name,
            shift: cg.shift,
            classroomName: cg.classroomName || 'Não Atribuída',
            classDays: cg.classDays,
            // Provide a fallback empty string if dates are null to match the TvDisplayInfo type
            startDate: cg.startDate ?? '',
            endDate: cg.endDate ?? '',
            status: status,
            classroomCapacity: classroom?.capacity,
            isUnderMaintenance: classroom?.isUnderMaintenance,
        };
    });

    return (
        <TvDisplayClient 
            allGroups={tvDisplayData} 
            announcements={[]} 
            lastPublished={new Date().toISOString()} 
        />
    );
}
