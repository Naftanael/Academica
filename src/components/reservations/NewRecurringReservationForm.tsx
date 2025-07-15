// src/components/reservations/NewRecurringReservationForm.tsx
'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { CalendarIcon as CalendarDateIcon, Info } from 'lucide-react';
import { format, isValid, getDay, isBefore, isAfter, parseISO, addDays, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale'; 
import { type DayModifiers } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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

interface NewRecurringReservationFormProps {
  classGroups: ClassGroup[];
  classrooms: Classroom[];
}

const dayOfWeekMapping: Record<DayOfWeek, number> = { 'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6 };

const initialState = { success: false, message: '', errors: undefined };

export default function NewRecurringReservationForm({ classGroups, classrooms }: NewRecurringReservationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction] = useFormState(createRecurringReservation, initialState);
  
  const [selectedClassGroup, setSelectedClassGroup] = React.useState<ClassGroup | undefined>();
  const [calculationResult, setCalculationResult] = React.useState<{ text: string, endDate: Date | null }>({ text: '', endDate: null });

  const form = useForm<RecurringReservationFormValues>({
    resolver: zodResolver(recurringReservationFormSchema),
    defaultValues: { classGroupId: '', classroomId: '', startDate: format(new Date(), 'yyyy-MM-dd'), numberOfClasses: 1, purpose: '' },
    errors: state.errors,
  });

  const { watch } = form;
  const watchedValues = watch();

  React.useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: 'Sucesso!', description: state.message });
        router.push('/reservations');
      } else {
        toast({ title: 'Erro', description: state.message, variant: 'destructive' });
      }
    }
  }, [state, toast, router]);

  React.useEffect(() => {
    const classGroup = classGroups.find(cg => cg.id === watchedValues.classGroupId);
    setSelectedClassGroup(classGroup);
  }, [watchedValues.classGroupId, classGroups]);
  
  React.useEffect(() => {
    const { startDate: startDateStr, numberOfClasses } = watchedValues;
    if (!selectedClassGroup || !startDateStr || !numberOfClasses || !isValid(parseISO(startDateStr))) {
      setCalculationResult({ text: '', endDate: null });
      return;
    }

    const startDate = parseISO(startDateStr);
    const numericalClassDays = selectedClassGroup.classDays.map(d => dayOfWeekMapping[d]);
    if(numericalClassDays.length === 0) return;

    let currentDate = new Date(startDate);
    let loopGuard = 0;
    while (!numericalClassDays.includes(getDay(currentDate)) && loopGuard++ < 365) {
      currentDate = addDays(currentDate, 1);
    }
    const firstClassDate = new Date(currentDate);

    let classesCount = 1;
    let lastClassDate = new Date(currentDate);
    while (classesCount < numberOfClasses && loopGuard++ < 730) {
      currentDate = addDays(currentDate, 1);
      if (numericalClassDays.includes(getDay(currentDate))) {
        classesCount++;
        lastClassDate = new Date(currentDate);
      }
    }

    const text = !isEqual(startDate, firstClassDate)
      ? `A 1ª aula será em ${format(firstClassDate, "dd/MM/yy")}. A ${numberOfClasses}ª aula terminará em ${format(lastClassDate, "dd/MM/yy")}.`
      : `A reserva terminará em ${format(lastClassDate, "dd/MM/yy")}.`;
    
    setCalculationResult({ text, endDate: lastClassDate });

  }, [selectedClassGroup, watchedValues.startDate, watchedValues.numberOfClasses]);

  const calendarModifiers = React.useMemo(() => {
    const modifiers: DayModifiers = {};
    if (calculationResult.endDate) {
      const startDate = parseISO(watchedValues.startDate);
      const numericalClassDays = selectedClassGroup?.classDays.map(d => dayOfWeekMapping[d]) || [];
      
      modifiers.isClassDayInRange = (date: Date) => {
        if (!isAfter(date, addDays(startDate, -1)) || !isBefore(date, addDays(calculationResult.endDate!, 1))) return false;
        return numericalClassDays.includes(getDay(date));
      };
      modifiers.isCalculatedEnd = calculationResult.endDate;
    }
    return modifiers;
  }, [selectedClassGroup, watchedValues.startDate, calculationResult.endDate]);

  return (
    <Card>
      <CardHeader><CardTitle>Nova Reserva Recorrente</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => formAction(data))} action={formAction} className="space-y-6">
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
                <FormItem className="flex flex-col"><FormLabel>Data de Início</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(parseISO(field.value), "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}<CalendarDateIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={date => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')} disabled={!selectedClassGroup} modifiers={calendarModifiers} modifiersStyles={{ isCalculatedEnd: { fontWeight: 'bold', border: '2px solid hsl(var(--primary))' }, isClassDayInRange: { backgroundColor: 'hsl(var(--accent)/0.3)', borderRadius: '0.25rem' } }} /></PopoverContent></Popover><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="numberOfClasses" render={({ field }) => (
                <FormItem><FormLabel>Número de Aulas</FormLabel><FormControl><Input type="number" placeholder="Ex: 10" {...field} onChange={e => field.onChange(+e.target.value)} /></FormControl><FormMessage /></FormItem>
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
