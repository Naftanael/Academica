
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
import { format, parseISO, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DeleteClassGroupButton } from './DeleteClassGroupButton';
import { EditClassGroupButton } from './EditClassGroupButton';

type ClassGroupStatus = 'Planejada' | 'Em Andamento' | 'Concluída';

interface ClassGroupRowProps {
  classGroup: ClassGroup & { classroomName?: string };
}

const ClassGroupRow = React.memo(({ classGroup }: ClassGroupRowProps) => {
  const { id, name, subject, shift, startDate, endDate, classroomName } = classGroup;

  const status: ClassGroupStatus = React.useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (isBefore(now, start)) return 'Planejada';
    if (isAfter(now, end)) return 'Concluída';
    return 'Em Andamento';
  }, [startDate, endDate]);

  const formattedStartDate = format(parseISO(startDate), 'dd/MM/yyyy', { locale: ptBR });
  const formattedEndDate = format(parseISO(endDate), 'dd/MM/yyyy', { locale: ptBR });

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

interface ClassGroupsTableClientProps {
  classGroups: (ClassGroup & { classroomName?: string })[];
}

export function ClassGroupsTableClient({ classGroups }: ClassGroupsTableClientProps) {
  return (
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
        {classGroups.map(cg => (
          <ClassGroupRow key={cg.id} classGroup={cg} />
        ))}
      </TableBody>
    </Table>
  );
}
