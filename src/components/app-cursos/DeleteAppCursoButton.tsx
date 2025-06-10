
'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { useToast } from '@/hooks/use-toast';
import { deleteAppCurso } from '@/lib/actions/app_cursos';

interface DeleteAppCursoButtonProps {
  appCursoId: string;
  className?: string;
}

export function DeleteAppCursoButton({ appCursoId, className }: DeleteAppCursoButtonProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = React.useState(false);

  const handleDelete = async () => {
    setIsPending(true);
    const result = await deleteAppCurso(appCursoId);
    setIsPending(false);
    if (result.success) {
      toast({
        title: "Sucesso!",
        description: result.message,
        variant: "default",
      });
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
        <Button variant="ghost" size="icon" className={className} disabled={isPending}>
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Excluir Curso</span>
        </Button>
      }
      dialogTitle="Excluir Curso?"
      dialogDescription="Esta ação não pode ser desfeita. Todos os dados do curso serão removidos permanentemente."
    />
  );
}
