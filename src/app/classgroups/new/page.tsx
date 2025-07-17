
// src/app/classgroups/new/page.tsx
import { NewClassGroupView } from '@/components/classgroups/NewClassGroupView';

/**
 * Page for creating a new class group.
 */
export default function NewClassGroupPage() {
    return (
        <div>
            {/* The actual UI is within the client component */}
            <NewClassGroupView classrooms={[]} />
        </div>
    );
}
