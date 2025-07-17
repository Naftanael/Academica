
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { ClassGroup } from '@/types';
import { format, parseISO, isBefore, isAfter, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DeleteClassGroupButton } from './DeleteClassGroupButton';
import { EditClassGroupButton } from './EditClassGroupButton';

type ClassGroupStatus = 'Planejada' | 'Em Andamento' | 'Concluída' | 'Indefinido';

// =================================================================================
// Helper Function for Displaying Dates
// =================================================================================

/**
 * Formats a date string for display, handling null or invalid values gracefully.
 * @param dateString - The ISO date string to format.
 * @returns A formatted date string or a fallback message.
 */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'Não definida';
  }
  const date = parseISO(dateString);
  return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Data inválida';
}


// =================================================================================
// ClassGroupRow Component
// =================================================================================

interface ClassGroupRowProps {
  classGroup: ClassGroup & { classroomName?: string };
}

// React.memo prevents re-rendering if props haven't changed, optimizing performance.
const ClassGroupRow = React.memo(({ classGroup }: ClassGroupRowProps) => {
  const { id, name, subject, shift, startDate, endDate, classroomName } = classGroup;

  // useMemo calculates the status only when dates change. It's now robust against nulls.
  const status: ClassGroupStatus = React.useMemo(() => {
    if (!startDate || !endDate) {
      return 'Indefinido';
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize current date for accurate comparison

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (!isValid(start) || !isValid(end)) {
      return 'Indefinido';
    }

    if (isBefore(now, start)) return 'Planejada';
    if (isAfter(now, end)) return 'Concluída';
    return 'Em Andamento';
  }, [startDate, endDate]);

  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  return (
    <TableRow>
      <TableCell>{name}</TableCell>
      <TableCell>{subject}</TableCell>
      <TableCell>{shift}</TableCell>
      <TableCell>{`${formattedStartDate} - ${formattedEndDate}`}</TableCell>
      <TableCell>
        <Badge
          variant={
            status === 'Em Andamento' ? 'default' :
            status === 'Planejada' ? 'secondary' :
            status === 'Indefinido' ? 'destructive' :
            'outline'
          }
        >
          {status}
        </Badge>
      </TableCell>
      <TableCell>{classroomName}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <EditClassGroupButton classGroupId={id} />
            <DeleteClassGroupButton classGroupId={id} />
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

ClassGroupRow.displayName = 'ClassGroupRow';


// =================================================================================
// Main Table Component
// =================================================================================

interface ClassGroupsTableClientProps {
  classGroups: (ClassGroup & { classroomName?: string })[];
}

export function ClassGroupsTableClient({ classGroups }: ClassGroupsTableClientProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome da Turma</TableHead>
            <TableHead>Curso</TableHead>
            <TableHead>Turno</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sala de Aula</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classGroups.length > 0 ? (
            classGroups.map(cg => (
              <ClassGroupRow key={cg.id} classGroup={cg} />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Nenhuma turma encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

