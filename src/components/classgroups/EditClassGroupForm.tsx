
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { updateClassGroup } from '@/lib/actions/classgroups';
import { useToast } from '@/hooks/use-toast';
import type { ClassGroup } from '@/types';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { classGroupEditSchema } from '@/lib/schemas/classgroups';
import { CalendarIcon } from 'lucide-react';
import { Textarea } from '../ui/textarea';

const daysOfWeek = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

interface EditClassGroupFormProps {
  classGroup: ClassGroup;
}

export default function EditClassGroupForm({ classGroup }: EditClassGroupFormProps) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(classGroupEditSchema),
    defaultValues: {
      ...classGroup,
      startDate: new Date(classGroup.startDate),
      endDate: new Date(classGroup.endDate),
    },
  });

  async function onSubmit(values: any) {
    try {
      const result = await updateClassGroup(classGroup.id, values);
      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Turma atualizada com sucesso.',
        });
      } else {
        toast({
          title: 'Erro',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar a turma.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Fields */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Turma</FormLabel>
              <FormControl>
                <Input placeholder="Ex: FMC24.1N" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Other fields... */}
      </form>
    </Form>
  );
}
