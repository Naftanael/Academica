
'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { useToast } from '@/hooks/use-toast';
import { deleteClassGroup } from '@/lib/actions/classgroups';

interface DeleteClassGroupButtonProps {
  classGroupId: string;
  className?: string;
}

export function DeleteClassGroupButton({ classGroupId, className }: DeleteClassGroupButtonProps) {
  const { toast } = useToast();
  // No need for isPending state here if DeleteConfirmationDialog handles it,
  // or if we want the server action to be the source of truth for loading.
  // For simplicity with toast, we can let the server action complete.

  const handleDelete = async () => {
    const result = await deleteClassGroup(classGroupId);
    if (result.success) {
      toast({
        title: "Sucesso!",
        description: result.message,
        variant: "default",
      });
      // Path revalidation is handled by the server action.
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
          <span className="sr-only">Excluir Turma</span>
        </Button>
      }
      dialogTitle="Excluir Turma?"
      dialogDescription="Esta ação não pode ser desfeita. Todos os dados da turma serão removidos."
    />
  );
}
