
'use client';

import Link from 'next/link';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EditClassGroupButtonProps {
  classGroupId: string;
  className?: string;
}

export function EditClassGroupButton({ classGroupId, className }: EditClassGroupButtonProps) {
  return (
    <Button variant="ghost" size="icon" asChild className={cn(className)}>
      <Link href={`/classgroups/${classGroupId}/edit`}>
        <Edit className="h-4 w-4" />
        <span className="sr-only">Editar Turma</span>
      </Link>
    </Button>
  );
}
