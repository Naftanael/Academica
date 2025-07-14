
'use client';

import * as React from 'react';
import { Calendar as CalendarIcon, Wrench, CheckCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useRoomAvailability } from '@/hooks/use-room-availability';
import { OccupancyBadge } from '@/components/room-availability/OccupancyBadge';
import type { Classroom, ClassGroup, EventReservation, ClassroomRecurringReservation } from '@/types';

interface RoomAvailabilityDisplayProps {
  initialClassrooms: Classroom[];
  initialClassGroups: ClassGroup[];
  initialEventReservations: EventReservation[];
  initialRecurringReservations: ClassroomRecurringReservation[];
}

export default function RoomAvailabilityDisplay({
  initialClassrooms,
  initialClassGroups,
  initialEventReservations,
  initialRecurringReservations,
}: RoomAvailabilityDisplayProps) {
  const { date, setDate, getOccupancyForCell, format, ptBR } = useRoomAvailability(
    initialClassrooms,
    initialClassGroups,
    initialEventReservations,
    initialRecurringReservations
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Disponibilidade Diária de Salas</CardTitle>
            <CardDescription>
              {date ? `Exibindo disponibilidade para ${format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}` : 'Selecione uma data'}
            </CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="datePicker"
                variant={"outline"}
                className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}
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
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {date ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {initialClassrooms.map(classroom => {
              const morning = getOccupancyForCell(classroom.id, 'Manhã');
              const afternoon = getOccupancyForCell(classroom.id, 'Tarde');
              const night = getOccupancyForCell(classroom.id, 'Noite');

              return (
                <div key={classroom.id} className={cn("rounded-lg border p-4 flex flex-col gap-3", classroom.isUnderMaintenance && "bg-amber-50 dark:bg-amber-900/40 border-amber-500/50")}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-foreground">{classroom.name}</h3>
                    {classroom.isUnderMaintenance && (
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger>
                          <Wrench className="h-5 w-5 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold">Em Manutenção</p>
                          {classroom.maintenanceReason && <p>{classroom.maintenanceReason}</p>}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  
                  <div className="space-y-2.5 text-sm">
                    {/* Manhã */}
                    <div className="flex items-start gap-3">
                      <span className="w-16 text-muted-foreground font-medium">Manhã</span>
                      {morning.status === 'Manutenção' ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-200">Manutenção</Badge>
                      ) : morning.status === 'Livre' ? (
                          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20"><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Livre</Badge>
                      ) : (
                          <div className="flex flex-col gap-1 w-full">
                            {morning.details.map((item, index) => <OccupancyBadge key={index} item={item} classGroups={initialClassGroups} />)}
                          </div>
                      )}
                    </div>
                    {/* Tarde */}
                    <div className="flex items-start gap-3">
                      <span className="w-16 text-muted-foreground font-medium">Tarde</span>
                       {afternoon.status === 'Manutenção' ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-200">Manutenção</Badge>
                      ) : afternoon.status === 'Livre' ? (
                          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20"><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Livre</Badge>
                      ) : (
                           <div className="flex flex-col gap-1 w-full">
                            {afternoon.details.map((item, index) => <OccupancyBadge key={index} item={item} classGroups={initialClassGroups} />)}
                          </div>
                      )}
                    </div>
                    {/* Noite */}
                    <div className="flex items-start gap-3">
                      <span className="w-16 text-muted-foreground font-medium">Noite</span>
                       {night.status === 'Manutenção' ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-200">Manutenção</Badge>
                      ) : night.status === 'Livre' ? (
                          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20"><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Livre</Badge>
                      ) : (
                           <div className="flex flex-col gap-1 w-full">
                            {night.details.map((item, index) => <OccupancyBadge key={index} item={item} classGroups={initialClassGroups} />)}
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground border-2 border-dashed rounded-lg">
            <p className="text-lg font-medium">Selecione uma data</p>
            <p>Para visualizar a disponibilidade das salas.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
