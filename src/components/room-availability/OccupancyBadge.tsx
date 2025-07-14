
'use client';

import * as React from 'react';
import { Wrench, BookOpen, Repeat, Calendar as EventCalendarIcon, CheckCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ClassGroup, OccupancyItem } from '@/types';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const OccupancyBadge = ({ item, classGroups }: { item: OccupancyItem, classGroups: ClassGroup[] }) => {
  const getTooltipContent = () => {
    switch (item.type) {
      case 'class':
        return <>
          <p className="font-semibold">Aula Regular</p>
          <p>Turma: {item.data.name}</p>
        </>;
      case 'recurring':
        const recurringClassGroup = classGroups.find(cg => cg.id === item.data.classGroupId);
        return <>
          <p className="font-semibold">Reserva Recorrente</p>
          <p>Propósito: {item.data.purpose}</p>
          {recurringClassGroup && <p>Turma: {recurringClassGroup.name}</p>}
        </>;
      case 'event':
        return <>
          <p className="font-semibold">Evento Pontual</p>
          <p>Título: {item.data.title}</p>
          <p>Horário: {item.data.startTime} - {item.data.endTime}</p>
          <p>Reservado por: {item.data.reservedBy}</p>
        </>;
      default: return null;
    }
  };

  const getBadgeContent = () => {
     switch (item.type) {
      case 'class':
        return <><BookOpen className="h-3 w-3 mr-1.5 inline-block" /> {item.data.name}</>;
      case 'recurring':
        return <><Repeat className="h-3 w-3 mr-1.5 inline-block" /> {item.data.purpose}</>;
      case 'event':
        return <><EventCalendarIcon className="h-3 w-3 mr-1.5 inline-block" /> {item.data.title}</>;
      default: return null;
    }
  }

  const getBadgeVariant = () => {
     switch (item.type) {
      case 'class': return 'default';
      case 'recurring': return 'secondary';
      case 'event': return 'destructive';
      default: return 'outline';
    }
  }

  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger className="w-full text-left">
        <Badge variant={getBadgeVariant()} className="text-xs px-2 py-1 block max-w-full truncate leading-tight font-medium shadow-sm w-full">
            {getBadgeContent()}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {getTooltipContent()}
      </TooltipContent>
    </Tooltip>
  );
};
