
'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { CalendarIcon as CalendarDateIcon, Info } from 'lucide-react';
import { format, isValid, getDay, isBefore, addDays, isEqual, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type DayModifiers } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import FormSubmitButton from '@/components/shared/FormSubmitButton';
import { createRecurringReservation } from '@/lib/actions/recurring_reservations';
import { recurringReservationFormSchema, type RecurringReservationFormValues } from '@/lib/schemas/recurring-reservations';
import type { ClassGroup, Classroom, DayOfWeek } from '@/types';
import { cn } from '@/lib/utils';

// =================================================================================
// Types and Constants
// =================================================================================

const dayOfWeekMapping: Record<DayOfWeek, number> = { 'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6 };
const initialState = { success: false, message: '', errors: undefined };

interface CalculationResult {
  text: string;
  endDate: Date | null;
}

// =================================================================================
// Helper Function: Date Calculation Logic
// =================================================================================

/**
 * Calculates the end date of a recurring reservation based on class days and number of classes.
 * This is a pure function, making it testable and predictable.
 * @returns An object with the result text and the calculated end date.
 */
function calculateReservationDates(
  startDate: Date,
  numberOfClasses: number,
  classGroup: ClassGroup | undefined
): CalculationResult {
  if (!classGroup || !isValid(startDate) || numberOfClasses <= 0 || !classGroup.classDays?.length) {
    return { text: '', endDate: null };
  }

  const numericalClassDays = classGroup.classDays.map(d => dayOfWeekMapping[d]);
  let currentDate = new Date(startDate);
  let firstClassDate: Date | null = null;
  let classesCount = 0;
  let lastClassDate: Date | null = null;
  let loopGuard = 0; // Prevents infinite loops

  // Find the first valid class day on or after the start date
  while (loopGuard < 365) {
    if (numericalClassDays.includes(getDay(currentDate))) {
      firstClassDate = new Date(currentDate);
      break;
    }
    currentDate = addDays(currentDate, 1);
    loopGuard++;
  }

  if (!firstClassDate) return { text: '', endDate: null };
  
  // Calculate the end date
  currentDate = new Date(firstClassDate);
  loopGuard = 0;
  while (classesCount < numberOfClasses && loopGuard < 730) {
    if (numericalClassDays.includes(getDay(currentDate))) {
      classesCount++;
      lastClassDate = new Date(currentDate);
    }
    currentDate = addDays(currentDate, 1);
    loopGuard++;
  }

  const text = !isEqual(startDate, firstClassDate)
    ? `A 1ª aula será em ${format(firstClassDate, "dd/MM/yy", { locale: ptBR })}. A ${numberOfClasses}ª aula terminará em ${format(lastClassDate!, "dd/MM/yy", { locale: ptBR })}.`
    : `A reserva terminará em ${format(lastClassDate!, "dd/MM/yy", { locale: ptBR })}.`;
  
  return { text, endDate: lastClassDate };
}


// =================================================================================
// Main Form Component
// =================================================================================

export default function NewRecurringReservationForm({ classGroups, classrooms }: { classGroups: ClassGroup[], classrooms: Classroom[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction] = useFormState(createRecurringReservation, initialState);
  
  const [calculationResult, setCalculationResult] = React.useState<CalculationResult>({ text: '', endDate: null });

  const form = useForm<RecurringReservationFormValues>({
    resolver: zodResolver(recurringReservationFormSchema),
    // Use Date objects directly, which is more robust.
    defaultValues: { classGroupId: '', classroomId: '', startDate: new Date(), numberOfClasses: 1, purpose: '' },
  });

  const watchedStartDate = form.watch('startDate');
  const watchedNumberOfClasses = form.watch('numberOfClasses');
  const watchedClassGroupId = form.watch('classGroupId');

  const selectedClassGroup = React.useMemo(() => 
    classGroups.find(cg => cg.id === watchedClassGroupId),
    [watchedClassGroupId, classGroups]
  );

  // Effect for handling form submission feedback
  React.useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Sucesso!' : 'Erro',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) router.push('/reservations');
    }
    if (state.errors) {
      for (const [key, value] of Object.entries(state.errors)) {
        if (value) form.setError(key as keyof RecurringReservationFormValues, { type: 'manual', message: value.join(', ') });
      }
    }
  }, [state, form, toast, router]);

  // Effect for calculating reservation end date
  React.useEffect(() => {
    const result = calculateReservationDates(watchedStartDate, watchedNumberOfClasses, selectedClassGroup);
    setCalculationResult(result);
  }, [selectedClassGroup, watchedStartDate, watchedNumberOfClasses]);

  // Memoize calendar modifiers for performance
  const calendarModifiers = React.useMemo(() => {
    const modifiers: DayModifiers = {};
    if (calculationResult.endDate && selectedClassGroup?.classDays) {
      const numericalClassDays = selectedClassGroup.classDays.map(d => dayOfWeekMapping[d]);
      modifiers.isClassDayInRange = (date: Date) => 
        isBefore(date, addDays(calculationResult.endDate!, 1)) && numericalClassDays.includes(getDay(date));
      modifiers.isCalculatedEnd = calculationResult.endDate;
    }
    return modifiers;
  }, [selectedClassGroup, calculationResult.endDate]);

  function handleFormSubmit(data: RecurringReservationFormValues) {
    const formData = new FormData();
    // Convert data to FormData for the server action
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else if (value != null) {
        formData.append(key, String(value));
      }
    });
    formAction(formData);
  }

  return (
    <Card>
      <CardHeader><CardTitle>Nova Reserva Recorrente</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField control={form.control} name="purpose" render={({ field }) => (
              <FormItem><FormLabel>Propósito</FormLabel><FormControl><Input placeholder="Ex: Aulas Regulares" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="classGroupId" render={({ field }) => (
                <FormItem><FormLabel>Turma</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger></FormControl><SelectContent>{classGroups.map(cg => <SelectItem key={cg.id} value={cg.id}>{cg.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="classroomId" render={({ field }) => (
                <FormItem><FormLabel>Sala</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione a sala" /></SelectTrigger></FormControl><SelectContent>{classrooms.map(cr => <SelectItem key={cr.id} value={cr.id}>{cr.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Data de Início</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}<CalendarDateIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={!selectedClassGroup} modifiers={calendarModifiers} modifiersStyles={{ isCalculatedEnd: { fontWeight: 'bold', border: '2px solid hsl(var(--primary))' }, isClassDayInRange: { backgroundColor: 'hsl(var(--accent)/0.3)', borderRadius: '0.25rem' } }} /></PopoverContent></Popover><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="numberOfClasses" render={({ field }) => (
                <FormItem><FormLabel>Número de Aulas</FormLabel><FormControl><Input type="number" placeholder="Ex: 10" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : +e.target.value)} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            {calculationResult.text && <div className="p-3 bg-accent/20 border rounded-md text-sm flex items-center gap-2"><Info className="h-4 w-4 text-primary" /><span>{calculationResult.text}</span></div>}
            <div className="flex justify-end"><FormSubmitButton>Salvar Reserva</FormSubmitButton></div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
