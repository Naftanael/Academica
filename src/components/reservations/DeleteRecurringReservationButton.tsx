
'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { useToast } from '@/hooks/use-toast';
import { deleteRecurringReservation } from '@/lib/actions/recurring_reservations';

interface DeleteRecurringReservationButtonProps {
  reservationId: string;
  className?: string;
}

export function DeleteRecurringReservationButton({ reservationId, className }: DeleteRecurringReservationButtonProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    const result = await deleteRecurringReservation(reservationId);
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
        <Button variant="ghost" size="icon" className={className}>
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Excluir Reserva Recorrente</span>
        </Button>
      }
      dialogTitle="Excluir Reserva Recorrente?"
      dialogDescription="Esta ação não pode ser desfeita. A reserva será removida permanentemente."
      confirmText="Excluir"
    />
  );
}
