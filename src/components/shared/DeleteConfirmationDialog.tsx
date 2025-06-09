'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { useState } from "react";

interface DeleteConfirmationDialogProps {
  onConfirm: () => Promise<void> | void;
  triggerButton: ReactNode;
  dialogTitle?: string;
  dialogDescription?: string;
  confirmText?: string;
  cancelText?: string;
}

export function DeleteConfirmationDialog({
  onConfirm,
  triggerButton,
  dialogTitle = "Tem certeza?",
  dialogDescription = "Esta ação não pode ser desfeita. Isso excluirá permanentemente o item.",
  confirmText = "Excluir",
  cancelText = "Cancelar",
}: DeleteConfirmationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to delete:", error);
      // Optionally show a toast message here
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{triggerButton}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
            {isPending ? "Excluindo..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
