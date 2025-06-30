
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { CalendarPlus as SaveIcon, CalendarIcon as CalendarDateIcon } from 'lucide-react';
import { format, parseISO, isValid as isValidDate } from 'date-fns';
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
import { Textarea } from '@/components/ui/textarea';
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
import { createEventReservation } from '@/lib/actions/event_reservations';
import { eventReservationFormSchema, type EventReservationFormValues } from '@/lib/schemas/event_reservations';
import type { Classroom } from '@/types';
import { cn } from '@/lib/utils';

interface NewEventReservationFormProps {
  classrooms: Classroom[];
}

export default function NewEventReservationForm({ classrooms }: NewEventReservationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = React.useState(false);

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

  async function onSubmit(values: EventReservationFormValues) {
    setIsPending(true);
    const result = await createEventReservation(values);
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
            form.setError(field as keyof EventReservationFormValues, {
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Evento</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Reunião de Coordenação" {...field} />
              </FormControl>
              <FormDescription>O nome ou motivo principal da reserva.</FormDescription>
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
              <FormDescription>A sala a ser reservada para o evento.</FormDescription>
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
                    <Button
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value && isValidDate(parseISO(field.value)) ? (
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
                    selected={field.value && isValidDate(parseISO(field.value)) ? parseISO(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                    initialFocus
                    locale={ptBR}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Disable past dates
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>Selecione a data para a reserva do evento.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
                <FormDescription>Início do evento.</FormDescription>
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
                <FormDescription>Fim do evento.</FormDescription>
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
              <FormControl>
                <Input placeholder="Ex: Prof. Silva / Departamento de TI" {...field} />
              </FormControl>
              <FormDescription>Nome do responsável ou departamento.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detalhes Adicionais (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Ex: Necessário projetor e acesso à internet." {...field} />
              </FormControl>
              <FormDescription>Qualquer informação extra sobre a reserva.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isPending ? "Salvando..." : (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                Salvar Reserva de Evento
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
