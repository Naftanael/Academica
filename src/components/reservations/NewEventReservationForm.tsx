// src/components/reservations/NewEventReservationForm.tsx
'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { CalendarIcon as CalendarDateIcon } from 'lucide-react';
import { format, parseISO, isValid as isValidDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import FormSubmitButton from '@/components/shared/FormSubmitButton';

import { createEventReservation } from '@/lib/actions/event_reservations';
import { eventReservationFormSchema, type EventReservationFormValues } from '@/lib/schemas/event_reservations';
import type { Classroom } from '@/types';
import { cn } from '@/lib/utils';

interface NewEventReservationFormProps {
  classrooms: Classroom[];
}

const initialState = {
  success: false,
  message: '',
  errors: undefined,
};

export default function NewEventReservationForm({ classrooms }: NewEventReservationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction] = useFormState(createEventReservation, initialState);

  const form = useForm<EventReservationFormValues>({
    resolver: zodResolver(eventReservationFormSchema),
    defaultValues: {
      classroomId: undefined,
      title: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '08:00',
      endTime: '09:00',
      reservedBy: '',
      details: '',
    },
  });
  
  React.useEffect(() => {
    if (state.errors) {
      for (const [key, value] of Object.entries(state.errors)) {
        if (value) {
          form.setError(key as keyof EventReservationFormValues, {
            type: 'manual',
            message: value.join(', '),
          });
        }
      }
    }
  }, [state.errors, form]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes da Reserva</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(data => formAction(data))}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Evento</FormLabel>
                  <FormControl><Input placeholder="Ex: Reunião de Coordenação" {...field} /></FormControl>
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
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione a sala" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {classrooms.map((cr) => (
                        <SelectItem key={cr.id} value={cr.id}>{cr.name} (Cap: {cr.capacity ?? 'N/A'})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Evento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value && isValidDate(parseISO(field.value)) ? format(parseISO(field.value), "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                          <CalendarDateIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Início</FormLabel>
                    <FormControl><Input type="time" {...field} /></FormControl>
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
                    <FormControl><Input type="time" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="reservedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reservado Por</FormLabel>
                  <FormControl><Input placeholder="Ex: Prof. Silva" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes (Opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Ex: Necessário projetor." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <FormSubmitButton>Salvar Reserva</FormSubmitButton>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
