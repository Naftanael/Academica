
'use client';

import * as React from 'react';
import { Home, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { assignClassroomToClassGroup } from '@/lib/actions/classgroups';
import type { ClassGroup, Classroom } from '@/types';

interface ChangeClassroomDialogProps {
  classGroup: ClassGroup;
  availableClassrooms: Classroom[];
  triggerButton?: React.ReactNode;
}

export function ChangeClassroomDialog({ classGroup, availableClassrooms, triggerButton }: ChangeClassroomDialogProps) {
  const { toast } = useToast();
  const [selectedClassroomId, setSelectedClassroomId] = React.useState<string | null>(classGroup.assignedClassroomId || null);
  const [isPending, setIsPending] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const currentClassroomName = 
    classGroup.assignedClassroomId 
    ? availableClassrooms.find(c => c.id === classGroup.assignedClassroomId)?.name || 'Desconhecida' 
    : 'Não atribuída';

  const handleSubmit = async () => {
    setIsPending(true);
    const result = await assignClassroomToClassGroup(classGroup.id, selectedClassroomId);
    setIsPending(false);

    if (result.success) {
      toast({
        title: 'Sucesso!',
        description: `Sala ${selectedClassroomId ? (availableClassrooms.find(c=>c.id === selectedClassroomId)?.name || 'selecionada') : 'removida'} atribuída à turma ${classGroup.name}.`,
      });
      setIsOpen(false); // Close dialog on success
    } else {
      toast({
        title: 'Erro',
        description: result.message || 'Não foi possível atualizar a sala da turma.',
        variant: 'destructive',
      });
    }
  };

  React.useEffect(() => {
    // Reset selected classroom if dialog is reopened with different initial state
    if (isOpen) {
      setSelectedClassroomId(classGroup.assignedClassroomId || null);
    }
  }, [isOpen, classGroup.assignedClassroomId]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm">
            <Home className="mr-2 h-4 w-4" />
            Trocar Sala
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Alterar Sala da Turma: {classGroup.name}</DialogTitle>
          <DialogDescription>
            Sala atual: <span className="font-semibold">{currentClassroomName}</span>.
            Selecione uma nova sala para esta turma ou remova a atribuição.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="classroom" className="text-right">
              Nova Sala
            </Label>
            <Select
              value={selectedClassroomId || 'none'}
              onValueChange={(value) => setSelectedClassroomId(value === 'none' ? null : value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione uma sala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma (Remover atribuição)</SelectItem>
                {availableClassrooms.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    {classroom.name} (Cap: {classroom.capacity ?? 'N/A'})
                  </SelectItem>
                ))}
                {availableClassrooms.length === 0 && (
                    <SelectItem value="no-classrooms" disabled>Nenhuma sala disponível</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>Cancelar</Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Salvando...' : (
              <>
                <Save className="mr-2 h-4 w-4" /> Salvar Alteração
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
