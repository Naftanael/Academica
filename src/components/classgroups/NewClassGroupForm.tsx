
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { classGroupCreateSchema } from '@/lib/schemas/classgroups';
import { createClassGroup } from '@/lib/actions/classgroups';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { DayOfWeek } from '@/types';
import { useFormState } from 'react-dom';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const daysOfWeek: DayOfWeek[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

interface NewClassGroupFormProps {
  onSuccess: () => void;
}

export default function NewClassGroupForm({ onSuccess }: NewClassGroupFormProps) {
  const form = useForm({
    resolver: zodResolver(classGroupCreateSchema),
    defaultValues: {
      name: '',
      subject: '',
      shift: 'Manhã',
      startDate: new Date(),
      endDate: new Date(),
      classDays: [],
      notes: '',
    },
  });

  const [state, formAction] = useFormState(createClassGroup, { success: false, message: '' });
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast({ title: "Sucesso!", description: state.message });
      onSuccess();
    } else if (state.message && !state.success) {
      toast({ title: "Erro", description: state.message, variant: "destructive" });
    }
  }, [state, onSuccess, toast]);

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Turma</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Turma A de ADS" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Curso</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Análise e Desenvolvimento de Sistemas" {...field} />
              </FormControl>
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
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o turno" />
                            </SelectTrigger>
                        </FormControl>
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
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                            <Input 
                                type="date" 
                                {...field} 
                                value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                                onChange={(e) => field.onChange(new Date(e.target.value))}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Data de Fim</FormLabel>
                        <FormControl>
                            <Input 
                                type="date" 
                                {...field} 
                                value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                                onChange={(e) => field.onChange(new Date(e.target.value))}
                            />
                        </FormControl>
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
                    <FormLabel>Dias de Aula</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                        {daysOfWeek.map((day) => (
                            <FormField
                                key={day}
                                control={form.control}
                                name="classDays"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(day)}
                                                onCheckedChange={(checked) => {
                                                    const newValue = checked
                                                        ? [...(field.value || []), day]
                                                        : (field.value || []).filter((value) => value !== day);
                                                    field.onChange(newValue);
                                                }}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">{day}</FormLabel>
                                    </FormItem>
                                )}
                            />
                        ))}
                    </div>
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
                    <FormControl>
                        <Textarea placeholder="Alguma observação sobre a turma?" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <Button type="submit">Salvar</Button>
      </form>
    </Form>
  );
}
