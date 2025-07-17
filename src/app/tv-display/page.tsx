
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms';
import TvDisplayClient from '@/components/tv-display/TvDisplayClient';
import { TvDisplayInfo, ClassGroup, Classroom } from '@/types';

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
        
        // Determine the status of the class group
        const now = new Date();
        const startDate = new Date(cg.startDate);
        const endDate = new Date(cg.endDate);
        let status: 'Planejada' | 'Em Andamento' | 'Concluída' | 'Cancelada' = 'Planejada';

        if (now >= startDate && now <= endDate) {
            status = 'Em Andamento';
        } else if (now > endDate) {
            status = 'Concluída';
        }

        return {
            id: cg.id,
            groupName: cg.name,
            shift: cg.shift,
            classroomName: cg.classroomName || 'Não Atribuída',
            classDays: cg.classDays,
            startDate: cg.startDate,
            endDate: cg.endDate,
            status: status,
            classroomCapacity: classroom ? classroom.capacity : undefined,
            isUnderMaintenance: classroom ? classroom.isUnderMaintenance : undefined,
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
