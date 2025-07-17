// src/components/room-availability/OccupancyBadge.tsx
'use client';

import * as React from 'react';
import { Wrench, BookOpen, Repeat, Calendar as EventCalendarIcon, CheckCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { ClassGroup, OccupancyItem } from '@/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type ExtendedOccupancyItem = 
  | OccupancyItem
  | { type: 'maintenance'; data: { reason: string } }
  | { type: 'free' };

export const OccupancyBadge = ({ item, classGroups }: { item: ExtendedOccupancyItem, classGroups: ClassGroup[] }) => {
  const getTooltipContent = () => {
    switch (item.type) {
      case 'maintenance':
        const reason = (item.data as { reason: string })?.reason;
        return <>
          <p className="font-semibold">Em Manutenção</p>
          {reason && <p>Motivo: {reason}</p>}
        </>;
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
      case 'maintenance':
        return <><Wrench className="h-3 w-3 mr-1.5 inline-block" /> Manutenção</>;
      case 'class':
        return <><BookOpen className="h-3 w-3 mr-1.5 inline-block" /> {item.data.name}</>;
      case 'recurring':
        return <><Repeat className="h-3 w-3 mr-1.5 inline-block" /> {item.data.purpose}</>;
      case 'event':
        return <><EventCalendarIcon className="h-3 w-3 mr-1.5 inline-block" /> {item.data.title}</>;
      case 'free':
        return <><CheckCircle className="h-3 w-3 mr-1.5 inline-block" /> Livre</>;
      default: return null;
    }
  }

  const getBadgeVariant = () => {
     switch (item.type) {
      case 'maintenance': return 'destructive';
      case 'class': return 'default';
      case 'recurring': return 'secondary';
      case 'event': return 'destructive';
      case 'free': return 'outline';
      default: return 'outline';
    }
  }
  
  const tooltipContent = getTooltipContent();

  if (!tooltipContent) {
    return (
        <Badge variant={getBadgeVariant()} className="text-xs px-2 py-1 block max-w-full truncate leading-tight font-medium shadow-sm w-full">
            {getBadgeContent()}
        </Badge>
    );
  }

  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger className="w-full text-left">
        <Badge variant={getBadgeVariant()} className="text-xs px-2 py-1 block max-w-full truncate leading-tight font-medium shadow-sm w-full">
            {getBadgeContent()}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
};