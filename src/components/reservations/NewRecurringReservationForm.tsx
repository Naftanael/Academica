
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { CalendarPlus, Save, CalendarIcon as CalendarDateIcon } from 'lucide-react';
import { format, parse, isValid, isWithinInterval, getDay, isBefore, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { createRecurringReservation } from '@/lib/actions/recurring_reservations';
import { recurringReservationFormSchema, type RecurringReservationFormValues } from '@/lib/schemas/recurring-reservations';
import type { ClassGroup, Classroom, DayOfWeek, ClassroomRecurringReservation, PeriodOfDay } from '@/types';
import { cn } from '@/lib/utils';
import { CLASS_GROUP_SHIFTS } from '@/lib/constants';

interface NewRecurringReservationFormProps {
  classGroups: ClassGroup[];
  classrooms: Classroom[];
  allRecurringReservations: ClassroomRecurringReservation[];
}

const dayOfWeekMapping: Record<DayOfWeek, number> = {
  'Domingo': 0,
  'Segunda': 1,
  'Terça': 2,
  'Quarta': 3,
  'Quinta': 4,
  'Sexta': 5,
  'Sábado': 6
};

const isEqualDate = (dateLeft: Date, dateRight: Date): boolean => {
  return dateLeft.getFullYear() === dateRight.getFullYear() &&
         dateLeft.getMonth() === dateRight.getMonth() &&
         dateLeft.getDate() === dateRight.getDate();
};

const dateRangesOverlapClient = (startA: Date, endA: Date, startB: Date, endB: Date): boolean => {
  return startA <= endB && endA >= startB;
};

// timeStringsOverlapClient is no longer needed for suggestion logic, comparing shifts directly.

export default function NewRecurringReservationForm({ classGroups, classrooms, allRecurringReservations }: NewRecurringReservationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = React.useState(false);
  const [selectedClassGroup, setSelectedClassGroup] = React.useState<ClassGroup | undefined>(undefined);
  const [suggestedClassrooms, setSuggestedClassrooms] = React.useState<Classroom[]>([]);
  const [attemptedSuggestions, setAttemptedSuggestions] = React.useState(false);


  const form = useForm<RecurringReservationFormValues>({
    resolver: zodResolver(recurringReservationFormSchema),
    defaultValues: {
      classGroupId: undefined,
      classroomId: undefined,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      shift: undefined, // Default shift
      purpose: '',
    },
  });

  const watchedClassGroupId = form.watch("classGroupId");
  const watchedStartDate = form.watch("startDate");
  const watchedEndDate = form.watch("endDate");
  const watchedShift = form.watch("shift"); // Watch shift instead of times

  React.useEffect(() => {
    if (watchedClassGroupId) {
      setSelectedClassGroup(classGroups.find(cg => cg.id === watchedClassGroupId));
    } else {
      setSelectedClassGroup(undefined);
    }
  }, [watchedClassGroupId, classGroups]);

  React.useEffect(() => {
    if (!watchedClassGroupId || !watchedStartDate || !watchedEndDate || !watchedShift) {
      setSuggestedClassrooms([]);
      setAttemptedSuggestions(false);
      return;
    }
    setAttemptedSuggestions(true);

    const currentFormValues = {
        classGroupId: watchedClassGroupId,
        startDate: watchedStartDate,
        endDate: watchedEndDate,
        shift: watchedShift, // Use shift
    };

    const targetClassGroup = classGroups.find(cg => cg.id === currentFormValues.classGroupId);
    if (!targetClassGroup) {
      setSuggestedClassrooms([]);
      return;
    }
    const targetClassDays = targetClassGroup.classDays;
    
    let newResStart: Date, newResEnd: Date;
    try {
        newResStart = parseISO(currentFormValues.startDate);
        newResEnd = parseISO(currentFormValues.endDate);
        if (!isValid(newResStart) || !isValid(newResEnd)) {
            setSuggestedClassrooms([]); return;
        }
    } catch (e) {
        setSuggestedClassrooms([]); return;
    }

    const suggestions: Classroom[] = [];
    for (const classroom of classrooms) {
      let isConflicted = false;
      for (const existingRes of allRecurringReservations) {
        if (existingRes.classroomId !== classroom.id) {
          continue;
        }

        let existingResStart: Date, existingResEnd: Date;
        try {
            existingResStart = parseISO(existingRes.startDate);
            existingResEnd = parseISO(existingRes.endDate);
             if (!isValid(existingResStart) || !isValid(existingResEnd)) continue;
        } catch (e) {
            continue;
        }

        if (!dateRangesOverlapClient(newResStart, newResEnd, existingResStart, existingResEnd)) {
          continue;
        }

        const existingResClassGroup = classGroups.find(cg => cg.id === existingRes.classGroupId);
        if (!existingResClassGroup) {
          continue; 
        }
        const existingReservationClassDays = existingResClassGroup.classDays;
        const commonClassDays = targetClassDays.filter(day => existingReservationClassDays.includes(day));

        if (commonClassDays.length > 0) {
          // Compare shifts directly for conflict in suggestion
          if (currentFormValues.shift === existingRes.shift) {
            isConflicted = true;
            break; 
          }
        }
      }

      if (!isConflicted) {
        suggestions.push(classroom);
      }
    }
    setSuggestedClassrooms(suggestions);

  }, [watchedClassGroupId, watchedStartDate, watchedEndDate, watchedShift, classrooms, classGroups, allRecurringReservations]);


  const classDayInRangeModifier = React.useCallback((date: Date): boolean => {
    if (!selectedClassGroup || !selectedClassGroup.classDays.length || !watchedStartDate || !watchedEndDate) {
      return false;
    }

    const rStart = parseISO(watchedStartDate);
    const rEnd = parseISO(watchedEndDate);

    if (!isValid(rStart) || !isValid(rEnd) || isBefore(rEnd, rStart)) {
      return false;
    }
    
    const dateIsWithinInterval = 
      (isAfter(date, rStart) || isEqualDate(date, rStart)) &&
      (isBefore(date, rEnd) || isEqualDate(date, rEnd));

    if (!dateIsWithinInterval) {
        return false;
    }

    const dayNum = getDay(date); 
    const numericalClassDays = selectedClassGroup.classDays.map(d => dayOfWeekMapping[d]);
    
    return numericalClassDays.includes(dayNum);
  }, [selectedClassGroup, watchedStartDate, watchedEndDate]);

  const modifiers = { 
    isClassDayInRange: classDayInRangeModifier,
  };

  const modifiersStyles = {
    isClassDayInRange: {
      backgroundColor: 'hsl(var(--accent) / 0.3)', 
      color: 'hsl(var(--foreground))', 
      borderRadius: '0.25rem',
    },
  };


  async function onSubmit(values: RecurringReservationFormValues) {
    setIsPending(true);
    
    const result = await createRecurringReservation(values);
    setIsPending(false);

    if (result.success) {
      toast({
        title: 'Sucesso!',
        description: result.message,
      });
      router.push('/reservations');
      router.refresh();
    } else {
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, errors]) => {
          if (errors) {
            form.setError(field as keyof RecurringReservationFormValues, {
              type: 'manual',
              message: Array.isArray(errors) ? errors.join(', ') : String(errors),
            });
          }
        });
        toast({
          title: 'Erro de Validação',
          description: result.message || "Por favor, corrija os campos destacados.",
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao criar reserva',
          description: result.message || 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Propósito da Reserva</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Aula de Reposição de Algoritmos" {...field} />
              </FormControl>
              <FormDescription>
                Um breve motivo para a reserva.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="classGroupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Turma</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                }} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {classGroups.length === 0 && <SelectItem value="no-cg" disabled>Nenhuma turma cadastrada</SelectItem>}
                  {classGroups.map((cg) => (
                    <SelectItem key={cg.id} value={cg.id}>
                      {cg.name} ({cg.shift})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>A turma que utilizará a sala. Os dias de aula desta turma serão usados para a reserva e destacados no calendário.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="classroomId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sala</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a sala" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {classrooms.length === 0 && <SelectItem value="no-cr" disabled>Nenhuma sala cadastrada</SelectItem>}
                  {classrooms.map((cr) => (
                    <SelectItem key={cr.id} value={cr.id}>
                      {cr.name} (Cap: {cr.capacity ?? 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>A sala a ser reservada.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {attemptedSuggestions && suggestedClassrooms.length > 0 && (
          <div className="mt-4 p-3 border rounded-md bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
            <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
              Sugestões de salas (baseado em outras reservas recorrentes):
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-green-600 dark:text-green-400">
              {suggestedClassrooms.map(room => (
                <li key={room.id}>
                  {room.name} (Cap: {room.capacity ?? 'N/A'})
                </li>
              ))}
            </ul>
          </div>
        )}
        {attemptedSuggestions && watchedClassGroupId && watchedStartDate && watchedEndDate && watchedShift && suggestedClassrooms.length === 0 && (
         <div className="mt-4 p-3 border rounded-md bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Nenhuma sala diretamente sugerida como livre para todos os dias de aula da turma selecionada neste turno e período.
              Verifique a disponibilidade manualmente ou prossiga (a validação final ocorrerá ao salvar).
            </p>
          </div>
        )}


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Início</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value && isValid(parseISO(field.value)) ? (
                          format(parseISO(field.value), "PPP", { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                        <CalendarDateIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value && isValid(parseISO(field.value)) ? parseISO(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                      initialFocus
                      locale={ptBR}
                      modifiers={modifiers}
                      modifiersStyles={modifiersStyles}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Início do período da reserva.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Fim</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value && isValid(parseISO(field.value)) ? (
                           format(parseISO(field.value), "PPP", { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                        <CalendarDateIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value && isValid(parseISO(field.value)) ? parseISO(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                      disabled={(date) => {
                        const startDateVal = form.getValues("startDate");
                        if (!startDateVal) return false;
                        const localStartDate = parseISO(startDateVal);
                        if (!isValid(localStartDate)) return false;
                        return isBefore(date, localStartDate) && !isEqualDate(date, localStartDate);
                      }}
                      initialFocus
                      locale={ptBR}
                      modifiers={modifiers}
                      modifiersStyles={modifiersStyles}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Fim do período da reserva.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="shift"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Turno da Reserva</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o turno para a reserva" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CLASS_GROUP_SHIFTS.map((shiftOption) => (
                    <SelectItem key={shiftOption} value={shiftOption}>
                      {shiftOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>O turno em que a sala será reservada nos dias de aula da turma selecionada.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isPending ? "Salvando..." : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Reserva Recorrente
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

