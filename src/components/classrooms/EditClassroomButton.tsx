// src/components/classrooms/EditClassroomButton.tsx
'use client';

import Link from 'next/link';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EditClassroomButtonProps {
  classroomId: string;
  className?: string;
}

export default function EditClassroomButton({ classroomId, className }: EditClassroomButtonProps) {
  return (
    <Button variant="ghost" size="icon" asChild className={cn(className)}>
      <Link href={`/classrooms/${classroomId}/edit`}>
        <Edit className="h-4 w-4" />
        <span className="sr-only">Editar Sala</span>
      </Link>
    </Button>
  );
}