
'use client';

import NewClassGroupForm from './NewClassGroupForm';
import type { Classroom } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NewClassGroupViewProps {
  classrooms: Classroom[];
}

/**
 * This component now acts as a simple client-side wrapper.
 * It receives server-fetched data and passes it down to the form.
 * The form is displayed directly inside a Card for consistent UI.
 */
export function NewClassGroupView({ classrooms }: NewClassGroupViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes da Nova Turma</CardTitle>
      </CardHeader>
      <CardContent>
        <NewClassGroupForm classrooms={classrooms} />
      </CardContent>
    </Card>
  );
}
