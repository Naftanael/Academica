// src/components/room-availability/RoomAvailabilityDisplay.tsx
'use client';

import { useState } from 'react';
import { CalendarIcon, School } from 'lucide-react';

import type { Classroom, ClassGroup, EventReservation, ClassroomRecurringReservation, PeriodOfDay } from '@/types';
import { useRoomAvailability } from '@/hooks/use-room-availability';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { OccupancyBadge } from '@/components/room-availability/OccupancyBadge';
import { PERIODS_OF_DAY } from '@/lib/constants';
import { cn } from '@/lib/utils';


interface RoomAvailabilityDisplayProps {
  initialClassrooms: Classroom[];
  initialClassGroups: ClassGroup[];
  initialEventReservations: EventReservation[];
  initialRecurringReservations: ClassroomRecurringReservation[];
}

/**
 * A client component to display the availability of rooms.
 * It shows a grid of classrooms and their occupancy status for a selected date.
 */
export default function RoomAvailabilityDisplay({ 
    initialClassrooms, 
    initialClassGroups, 
    initialEventReservations,
    initialRecurringReservations 
}: RoomAvailabilityDisplayProps) {
    const { date, setDate, getOccupancyForCell, format, ptBR } = useRoomAvailability(
        initialClassrooms,
        initialClassGroups,
        initialEventReservations,
        initialRecurringReservations
    );

    const classrooms = initialClassrooms || [];
    const classGroups = initialClassGroups || [];

    if (classrooms.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground py-8">
                        <School className="mx-auto h-12 w-12 text-primary" />
                        <p className="mt-4 text-lg">Nenhuma sala cadastrada.</p>
                        <p className="text-sm">Cadastre salas para visualizar a disponibilidade.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold">Status das Salas</h2>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal sm:w-[280px]",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            
            <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            <th scope="col" className="sticky left-0 z-10 bg-muted/50 px-6 py-3.5 text-left text-sm font-semibold text-foreground">
                                Sala
                            </th>
                            {PERIODS_OF_DAY.map(shift => (
                                <th key={shift} scope="col" className="px-6 py-3.5 text-center text-sm font-semibold text-foreground">
                                    {shift}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                        {classrooms.map((classroom) => {
                            const isMaintenance = classroom.isUnderMaintenance;
                            return (
                                <tr key={classroom.id} className={cn(isMaintenance && 'bg-amber-50 dark:bg-amber-900/20')}>
                                    <td className="sticky left-0 z-10 whitespace-nowrap bg-background px-6 py-4 text-sm font-medium text-foreground group-hover:bg-muted/80">
                                        {classroom.name}
                                        {isMaintenance && <span className="ml-2 text-xs text-amber-600">(Manutenção)</span>}
                                    </td>
                                    {PERIODS_OF_DAY.map(shift => {
                                        const { status, details } = getOccupancyForCell(classroom.id, shift);
                                        const cellContent = isMaintenance ? (
                                            <OccupancyBadge item={{ type: 'maintenance', data: { reason: classroom.maintenanceReason || 'Interditada' } }} classGroups={classGroups} />
                                        ) : (
                                            status === 'Ocupada' ? (
                                                <div className="flex flex-col gap-1.5 items-center">
                                                    {details.map((item, index) => (
                                                        <OccupancyBadge key={index} item={item} classGroups={classGroups} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <OccupancyBadge item={{ type: 'free' }} classGroups={classGroups} />
                                            )
                                        );

                                        return (
                                            <td key={shift} className="whitespace-nowrap px-6 py-4 text-center text-sm">
                                                {cellContent}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}