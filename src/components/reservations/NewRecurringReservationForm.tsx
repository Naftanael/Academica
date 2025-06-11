
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
// Removed z from here as schema is fully imported
import { useRouter } from 'next/navigation';
import { CalendarPlus, Save } from 'lucide-react';
import { format } from 'date-fns';
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
// Textarea import removed as it's not used
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
import { recurringReservationFormSchema, type RecurringReservationFormValues } from '@/lib/schemas/recurring-reservations'; // Updated import path
import type { ClassGroup, Classroom } from '@/types'; // Removed DayOfWeek
// import { DAYS_OF_WEEK } from '@/lib/constants'; // No longer needed here
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';


interface NewRecurringReservationFormProps {
  classGroups: ClassGroup[];
  classrooms: Classroom[];
}

export default function NewRecurringReservationForm({ classGroups, classrooms }: NewRecurringReservationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<RecurringReservationFormValues>({
    resolver: zodResolver(recurringReservationFormSchema),
    defaultValues: {
      classGroupId: undefined,
      classroomId: undefined,
      startDate: format(new Date(), 'yyyy-MM-dd'), // Store as YYYY-MM-DD string
      endDate: format(new Date(), 'yyyy-MM-dd'),   // Store as YYYY-MM-DD string
      // dayOfWeek: undefined, // Removed
      startTime: '08:00',
      endTime: '09:00',
      purpose: '',
    },
  });

  async function onSubmit(values: RecurringReservationFormValues) {
    setIsPending(true);
    
    // Dates are already in YYYY-MM-DD string format from the form defaultValues and Calendar onSelect.
    // No further transformation needed here if Calendar always returns 'yyyy-MM-dd'.
    const submissionValues = {
        ...values,
    };

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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          format(new Date(field.value + "T00:00:00"), "PPP", { locale: ptBR }) // Ensure parsing as local date
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
                      selected={field.value ? new Date(field.value + "T00:00:00") : undefined} // Ensure parsing as local date
                      onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                      initialFocus
                      locale={ptBR}
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
                           format(new Date(field.value + "T00:00:00"), "PPP", { locale: ptBR }) // Ensure parsing as local date
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
                      selected={field.value ? new Date(field.value + "T00:00:00") : undefined} // Ensure parsing as local date
                      onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                      disabled={(date) => {
                        const startDateVal = form.getValues("startDate");
                        if (!startDateVal) return false;
                        // Ensure comparison is with local dates
                        return date < new Date(startDateVal + "T00:00:00"); 
                      }}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Fim do período da reserva.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* DayOfWeek Field Removed
        <FormField
          control={form.control}
          name="dayOfWeek"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dia da Semana</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia da semana para a reserva" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>O dia em que a reserva se repetirá semanalmente.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        */}

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
