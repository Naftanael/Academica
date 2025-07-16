
'use client';

import * as React from 'react';
import { Home, Save, Wrench } from 'lucide-react';
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
import { changeClassroom, unassignClassroomFromClassGroup } from '@/lib/actions/classgroups';
import type { ClassGroup, Classroom } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChangeClassroomDialogProps {
  classGroup: ClassGroup;
  availableClassrooms: Classroom[];
  triggerButton?: React.ReactNode;
  onClassroomSelected?: (classroomId: string | null) => void;
}

export function ChangeClassroomDialog({ 
  classGroup, 
  availableClassrooms, 
  triggerButton,
  onClassroomSelected 
}: ChangeClassroomDialogProps) {
  const { toast } = useToast();
  const [selectedClassroomId, setSelectedClassroomId] = React.useState<string | null>(classGroup.assignedClassroomId || null);
  const [isPending, setIsPending] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const currentClassroomDetails = classGroup.assignedClassroomId
    ? availableClassrooms.find(c => c.id === classGroup.assignedClassroomId)
    : null;

  const currentClassroomName = currentClassroomDetails?.name || (classGroup.assignedClassroomId ? 'Desconhecida' : 'Não atribuída');
  const isCurrentClassroomInMaintenance = currentClassroomDetails?.isUnderMaintenance;


  const handleSelectionChange = (value: string | null) => {
    setSelectedClassroomId(value);
    if (onClassroomSelected) {
      onClassroomSelected(value);
      // Close the dialog immediately upon selection in creation mode
      if (classGroup.id === 'temp-id') {
        setIsOpen(false);
      }
    }
  };
  
  const handleSubmit = async () => {
    if (classGroup.id === 'temp-id') {
       if(onClassroomSelected) {
         onClassroomSelected(selectedClassroomId)
         setIsOpen(false)
       }
       return
    }
    
    setIsPending(true);
    let result;
    if (selectedClassroomId) {
      result = await changeClassroom(classGroup.id, selectedClassroomId);
    } else {
      result = await unassignClassroomFromClassGroup(classGroup.id);
    }
    setIsPending(false);

    if (result.success) {
      toast({
        title: 'Sucesso!',
        description: `Sala ${selectedClassroomId ? (availableClassrooms.find(c=>c.id === selectedClassroomId)?.name || 'selecionada') : 'removida'} atribuída à turma ${classGroup.name}.`,
      });
      setIsOpen(false);
    } else {
      toast({
        title: 'Erro',
        description: result.message || 'Não foi possível atualizar a sala da turma.',
        variant: 'destructive',
      });
    }
  };

  React.useEffect(() => {
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
      <TooltipProvider>
        <DialogHeader>
          <DialogTitle>Alterar Sala da Turma: {classGroup.name}</DialogTitle>
          <DialogDescription>
            {classGroup.id !== 'temp-id' && (
                <>
                    Sala atual: <span className="font-semibold">{currentClassroomName}</span>
                    {isCurrentClassroomInMaintenance && <span className="ml-1 text-amber-600">(Em Manutenção)</span>}.
                </>
            )}
            Selecione uma nova sala ou remova a atribuição.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="classroom" className="text-right">
              Nova Sala
            </Label>
            <Select
              value={selectedClassroomId || 'none'}
              onValueChange={(value) => handleSelectionChange(value === 'none' ? null : value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione uma sala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma (Remover atribuição)</SelectItem>
                {availableClassrooms.map((classroom) => (
                  <SelectItem 
                    key={classroom.id} 
                    value={classroom.id} 
                    disabled={classroom.isUnderMaintenance && classroom.id !== classGroup.assignedClassroomId}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{classroom.name} (Cap: {classroom.capacity ?? 'N/A'})</span>
                      {classroom.isUnderMaintenance && (
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                             <Wrench className="h-4 w-4 text-amber-500 ml-2" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs bg-popover text-popover-foreground p-2 border shadow-md rounded-md">
                            <p className="font-semibold mb-1">Em Manutenção</p>
                            {classroom.maintenanceReason && <p className="text-xs">{classroom.maintenanceReason}</p>}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {availableClassrooms.length === 0 && (
                    <SelectItem value="no-classrooms" disabled>Nenhuma sala disponível</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
           {selectedClassroomId && availableClassrooms.find(c => c.id === selectedClassroomId)?.isUnderMaintenance && (
            <p className="col-span-4 text-xs text-amber-600 dark:text-amber-400 text-center mt-1">
              Atenção: A sala selecionada está em manutenção.
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>Cancelar</Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || (
                classGroup.id !== 'temp-id' &&
                selectedClassroomId !== null &&
                selectedClassroomId !== classGroup.assignedClassroomId &&
                (availableClassrooms.find(c => c.id === selectedClassroomId)?.isUnderMaintenance ?? false)
            )}
          >
            {isPending ? 'Salvando...' : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {classGroup.id === 'temp-id' ? 'Confirmar Seleção' : 'Salvar Alteração'}
              </>
            )}
          </Button>
        </DialogFooter>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
