// src/components/classgroups/NewClassGroupForm.tsx
'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { createClassGroup } from '@/lib/actions/classgroups';
import { classGroupCreateSchema } from '@/lib/schemas/classgroups';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { ClassGroup } from '@/types';


import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import FormSubmitButton from '@/components/shared/FormSubmitButton';
import { CalendarIcon } from 'lucide-react';

const daysOfWeek = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;

const initialState = {
  success: false,
  message: '',
  errors: undefined,
};

type ClassGroupFormValues = z.infer<typeof classGroupCreateSchema>;

interface NewClassGroupFormProps {
  onClassGroupCreated: (newClassGroup: ClassGroup) => Promise<void>;
}


export default function NewClassGroupForm({ onClassGroupCreated }: NewClassGroupFormProps) {
  const { toast } = useToast();
  const [state, formAction] = useFormState(createClassGroup, initialState);

  const form = useForm<ClassGroupFormValues>({
    resolver: zodResolver(classGroupCreateSchema),
    defaultValues: {
      name: '',
      classDays: [],
      shift: 'Manhã',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    },
  });

  React.useEffect(() => {
    if (state.errors) {
      for (const [key, value] of Object.entries(state.errors)) {
        form.setError(key as keyof ClassGroupFormValues, {
          type: 'manual',
          message: value.join(', '),
        });
      }
    }
  }, [state.errors, form]);

  React.useEffect(() => {
    if (state.success && state.message && state.data) {
      onClassGroupCreated(state.data);
    } else if (!state.success && state.message) {
      toast({ title: 'Erro', description: state.message, variant: 'destructive' });
    }
  }, [state, onClassGroupCreated, toast]);
  
  const watchedShift = form.watch('shift');
  const watchedClassDays = form.watch('classDays');
  const showSaturdayNote = watchedClassDays.includes('Sábado') && watchedShift === 'Noite';

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(data => formAction(data))}
        className="space-y-8"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Turma</FormLabel>
                  <FormControl><Input placeholder="Ex: FMC24.1N" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shift"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turno</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Manhã">Manhã</SelectItem>
                      <SelectItem value="Tarde">Tarde</SelectItem>
                      <SelectItem value="Noite">Noite</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Início</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                          {field.value ? format(parseISO(field.value), 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')} initialFocus />
                    </PopoverContent>
                  </Popover>
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
                        <Button variant="outline" className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                          {field.value ? format(parseISO(field.value), 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <FormField
            control={form.control}
            name="classDays"
            render={() => (
                <FormItem>
                    <div className="mb-4">
                        <FormLabel>Dias de Aula</FormLabel>
                        <FormDescription>Selecione os dias em que a turma terá aula.</FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {daysOfWeek.map((day) => (
                        <FormField
                            key={day}
                            control={form.control}
                            name="classDays"
                            render={({ field }) => (
                              <FormItem key={day} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                      checked={field.value?.includes(day)}
                                      onCheckedChange={(checked) => checked
                                          ? field.onChange([...field.value, day])
                                          : field.onChange(field.value?.filter((v) => v !== day))
                                      }
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{day}</FormLabel>
                              </FormItem>
                            )}
                        />
                      ))}
                    </div>
                    {showSaturdayNote && <p className="mt-3 text-sm text-amber-600">Lembrete: Aulas de Sábado à Noite são transferidas para a Tarde.</p>}
                    <FormMessage />
                </FormItem>
            )}
        />
        
        <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl><Textarea placeholder="Adicione observações relevantes..." {...field} /></FormControl>
                  <FormMessage />
              </FormItem>
            )}
        />

        <div className="flex justify-end">
            <FormSubmitButton>Criar Turma</FormSubmitButton>
        </div>
      </form>
    </Form>
  );
}
