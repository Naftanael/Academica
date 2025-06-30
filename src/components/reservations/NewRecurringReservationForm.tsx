
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { CalendarPlus, Save, CalendarIcon as CalendarDateIcon, Info } from 'lucide-react';
import { format, parse, isValid, isWithinInterval, getDay, isBefore, isAfter, parseISO, addDays, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type DayModifiers } from 'react-day-picker';

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

export default function NewRecurringReservationForm({ classGroups, classrooms, allRecurringReservations }: NewRecurringReservationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = React.useState(false);
  const [selectedClassGroup, setSelectedClassGroup] = React.useState<ClassGroup | undefined>(undefined);
  const [calculatedEndDate, setCalculatedEndDate] = React.useState<Date | null>(null);
  const [calculationResultText, setCalculationResultText] = React.useState<string>('');


  const form = useForm<RecurringReservationFormValues>({
    resolver: zodResolver(recurringReservationFormSchema),
    defaultValues: {
      classGroupId: undefined,
      classroomId: undefined,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      numberOfClasses: 1,
      shift: undefined,
      purpose: '',
    },
  });

  const watchedClassGroupId = form.watch("classGroupId");
  const watchedStartDate = form.watch("startDate");
  const watchedNumberOfClasses = form.watch("numberOfClasses");

  React.useEffect(() => {
    if (watchedClassGroupId) {
      const classGroup = classGroups.find(cg => cg.id === watchedClassGroupId);
      setSelectedClassGroup(classGroup);
      if (classGroup) {
        form.setValue('shift', classGroup.shift);
      }
    } else {
      setSelectedClassGroup(undefined);
    }
  }, [watchedClassGroupId, classGroups, form]);
  
  React.useEffect(() => {
    const classGroup = selectedClassGroup;
    const startDateStr = watchedStartDate;
    const numberOfClasses = watchedNumberOfClasses;

    if (!classGroup || !startDateStr || !numberOfClasses || numberOfClasses <= 0 || !isValid(parseISO(startDateStr))) {
      setCalculatedEndDate(null);
      setCalculationResultText('');
      return;
    }
    
    const startDate = parseISO(startDateStr);
    const classDays = classGroup.classDays;
    const numericalClassDays = classDays.map(d => dayOfWeekMapping[d]);
    
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    let classesCount = 0;
    let lastClassDate = new Date(currentDate);

    let loop_guard = 0;
    const max_days_to_check = 365 * 2;

    while (!numericalClassDays.includes(getDay(currentDate)) && loop_guard < max_days_to_check) {
      currentDate = addDays(currentDate, 1);
      loop_guard++;
    }
    const firstClassDate = new Date(currentDate);

    classesCount = 1;
    lastClassDate = new Date(currentDate);
    
    while (classesCount < numberOfClasses && loop_guard < max_days_to_check) {
      currentDate = addDays(currentDate, 1);
      if (numericalClassDays.includes(getDay(currentDate))) {
        classesCount++;
        lastClassDate = new Date(currentDate);
      }
      loop_guard++;
    }

    setCalculatedEndDate(lastClassDate);
    const startIsClassDay = numericalClassDays.includes(getDay(startDate));
    const firstDayText = format(firstClassDate, "dd/MM/yyyy", { locale: ptBR });
    const lastDayText = format(lastClassDate, "dd/MM/yyyy", { locale: ptBR });

    if (!startIsClassDay) {
      setCalculationResultText(`A 1ª aula será em ${firstDayText}. A ${numberOfClasses}ª aula terminará em ${lastDayText}.`);
    } else {
      setCalculationResultText(`A reserva terminará em ${lastDayText}.`);
    }

  }, [selectedClassGroup, watchedStartDate, watchedNumberOfClasses]);

  const classDayInRangeModifier = React.useCallback((date: Date): boolean => {
    if (!selectedClassGroup || !selectedClassGroup.classDays.length || !calculatedEndDate) {
      return false;
    }
    
    const startDate = parseISO(watchedStartDate);
    if (!isValid(startDate)) return false;

    
    let firstClassDate = new Date(startDate);
    const numericalClassDays = selectedClassGroup.classDays.map(d => dayOfWeekMapping[d]);
    while (!numericalClassDays.includes(getDay(firstClassDate))) {
        firstClassDate = addDays(firstClassDate, 1);
    }
    
    const dateIsWithinInterval = 
      (isAfter(date, firstClassDate) || isEqual(date, firstClassDate)) &&
      (isBefore(date, calculatedEndDate) || isEqual(date, calculatedEndDate));

    if (!dateIsWithinInterval) {
        return false;
    }

    const dayNum = getDay(date); 
    return numericalClassDays.includes(dayNum);
  }, [selectedClassGroup, watchedStartDate, calculatedEndDate, isEqual]);

  const modifiers: DayModifiers = { 
    isClassDayInRange: classDayInRangeModifier,
  };

  if (calculatedEndDate) {
    modifiers.isCalculatedEnd = calculatedEndDate;
  }

  const modifiersStyles = {
    isClassDayInRange: {
      backgroundColor: 'hsl(var(--accent) / 0.3)', 
      color: 'hsl(var(--foreground))', 
      borderRadius: '0.25rem',
    },
    isCalculatedEnd: {
      fontWeight: 'bold',
      border: '2px solid hsl(var(--primary))',
    }
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
                <Input placeholder="Ex: Aulas Regulares" {...field} />
              </FormControl>
              <FormDescription>
                Um breve motivo para a reserva.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    value={field.value || ''}
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
                  <FormDescription>A turma que utilizará a sala.</FormDescription>
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
                  <Select onValueChange={field.onChange} value={field.value || ''}>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Início da Reserva</FormLabel>
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
                      disabled={!selectedClassGroup}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>A partir de quando a reserva deve começar.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

           <FormField
            control={form.control}
            name="numberOfClasses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Aulas</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Ex: 10" 
                    {...field} 
                    onChange={event => field.onChange(event.target.value === '' ? '' : +event.target.value)} 
                  />
                </FormControl>
                <FormDescription>Total de aulas recorrentes a reservar.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {calculationResultText && (
          <div className="p-3 bg-accent/20 border border-accent/30 rounded-md text-sm text-accent-foreground flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <span>{calculationResultText}</span>
          </div>
        )}

        <FormField
          control={form.control}
          name="shift"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Turno da Reserva</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger disabled>
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
              <FormDescription>O turno é definido automaticamente com base na turma selecionada.</FormDescription>
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
