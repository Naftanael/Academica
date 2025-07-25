// src/components/classrooms/DeleteClassroomButton.tsx
'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { useToast } from '@/hooks/use-toast';
import { deleteClassroom } from '@/lib/actions/classrooms';

interface DeleteClassroomButtonProps {
  classroomId: string;
  className?: string;
}

export default function DeleteClassroomButton({ classroomId, className }: DeleteClassroomButtonProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    const result = await deleteClassroom(classroomId);
    if (result.success) {
      toast({
        title: "Sucesso!",
        description: result.message,
      });
      // Revalidation is handled by the server action.
    } else {
      toast({
        title: "Erro",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DeleteConfirmationDialog
      onConfirm={handleDelete}
      triggerButton={
        <Button variant="ghost" size="icon" className={className}>
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Excluir Sala</span>
        </Button>
      }
      dialogTitle="Excluir Sala de Aula?"
      dialogDescription="Esta ação não pode ser desfeita. Todos os dados da sala, incluindo associações com turmas, serão removidos."
    />
  );
}