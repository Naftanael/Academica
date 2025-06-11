
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { CalendarPlus, Save, CalendarIcon } from 'lucide-react';
import { format, parse, isValid, isWithinInterval, getDay, isBefore, isAfter } from 'date-fns';
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
import type { ClassGroup, Classroom, DayOfWeek } from '@/types';
import { cn } from '@/lib/utils';

interface NewRecurringReservationFormProps {
  classGroups: ClassGroup[];
  classrooms: Classroom[];
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

export default function NewRecurringReservationForm({ classGroups, classrooms }: NewRecurringReservationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = React.useState(false);
  const [selectedClassGroup, setSelectedClassGroup] = React.useState<ClassGroup | undefined>(undefined);

  const form = useForm<RecurringReservationFormValues>({
    resolver: zodResolver(recurringReservationFormSchema),
    defaultValues: {
      classGroupId: undefined,
      classroomId: undefined,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      startTime: '08:00',
      endTime: '09:00',
      purpose: '',
    },
  });

  const watchedClassGroupId = form.watch("classGroupId");
  const watchedStartDate = form.watch("startDate");
  const watchedEndDate = form.watch("endDate");

  React.useEffect(() => {
    if (watchedClassGroupId) {
      setSelectedClassGroup(classGroups.find(cg => cg.id === watchedClassGroupId));
    } else {
      setSelectedClassGroup(undefined);
    }
  }, [watchedClassGroupId, classGroups]);

  const classDayInRangeModifier = (date: Date): boolean => {
    if (!selectedClassGroup || !selectedClassGroup.classDays.length || !watchedStartDate || !watchedEndDate) {
      return false;
    }

    const rStart = parse(watchedStartDate, 'yyyy-MM-dd', new Date());
    const rEnd = parse(watchedEndDate, 'yyyy-MM-dd', new Date());

    if (!isValid(rStart) || !isValid(rEnd) || isBefore(rEnd, rStart)) {
      return false;
    }
    
    // Check if the current calendar date is within the selected reservation interval (inclusive)
    const dateIsWithinInterval = 
      (isAfter(date, rStart) || isEqual(date, rStart)) &&
      (isBefore(date, rEnd) || isEqual(date, rEnd));

    if (!dateIsWithinInterval) {
        return false;
    }

    const dayNum = getDay(date); // 0 for Sunday, 1 for Monday, etc.
    const numericalClassDays = selectedClassGroup.classDays.map(d => dayOfWeekMapping[d]);
    
    return numericalClassDays.includes(dayNum);
  };

  const modifiers = { 
    isClassDayInRange: classDayInRangeModifier,
  };

  const modifiersStyles = {
    isClassDayInRange: {
      backgroundColor: 'hsl(var(--accent) / 0.3)', // Light orange background
      color: 'hsl(var(--foreground))', // Keep text color normal
      borderRadius: '0.25rem',
    },
  };


  async function onSubmit(values: RecurringReservationFormValues) {
    setIsPending(true);
    
    const submissionValues = { ...values };

    const result = await createRecurringReservation(submissionValues);
    setIsPending(false);

    if (result.success) {
      toast({
        title: 'Sucesso!',
        description: result.message,
      });
      router.push('/reservations');
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
          description: "Por favor, corrija os campos destacados.",
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

  const isEqual = (dateLeft: Date, dateRight: Date): boolean => {
    return dateLeft.getFullYear() === dateRight.getFullYear() &&
           dateLeft.getMonth() === dateRight.getMonth() &&
           dateLeft.getDate() === dateRight.getDate();
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
                  const group = classGroups.find(cg => cg.id === value);
                  setSelectedClassGroup(group);
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
                      {cg.name} ({cg.shift}) - Dias: {cg.classDays.join(', ').substring(0,20)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>A turma que utilizará a sala. Os dias de aula desta turma serão usados para a reserva.</FormDescription>
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
                        {field.value ? (
                          format(parse(field.value, 'yyyy-MM-dd', new Date()), "PPP", { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? parse(field.value, 'yyyy-MM-dd', new Date()) : undefined}
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
                        {field.value ? (
                           format(parse(field.value, 'yyyy-MM-dd', new Date()), "PPP", { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? parse(field.value, 'yyyy-MM-dd', new Date()) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                      disabled={(date) => {
                        const startDateVal = form.getValues("startDate");
                        if (!startDateVal) return false;
                        const localStartDate = parse(startDateVal, 'yyyy-MM-dd', new Date());
                        if (!isValid(localStartDate)) return false;
                        return isBefore(date, localStartDate);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Início</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Fim</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
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

