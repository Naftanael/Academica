'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';

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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { updateClassGroup } from '@/lib/actions/classgroups';
import { CLASS_GROUP_SHIFTS, DAYS_OF_WEEK } from '@/lib/constants';
import type { ClassGroup, ClassGroupShift, DayOfWeek } from '@/types';

const formSchema = z.object({
  name: z.string().min(3, { message: "O nome da turma deve ter pelo menos 3 caracteres." }),
  shift: z.enum(CLASS_GROUP_SHIFTS as [string, ...string[]], {
    required_error: "Selecione um turno.",
    invalid_type_error: "Turno inválido.",
  }),
  classDays: z.array(z.enum(DAYS_OF_WEEK as [string, ...string[]]))
    .min(1, { message: "Selecione pelo menos um dia da semana." }),
});

type EditClassGroupFormValues = z.infer<typeof formSchema>;

interface EditClassGroupFormProps {
  classGroup: ClassGroup;
}

export default function EditClassGroupForm({ classGroup }: EditClassGroupFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<EditClassGroupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: classGroup.name,
      shift: classGroup.shift,
      classDays: classGroup.classDays || [],
    },
  });

  const onSubmit = async (values: EditClassGroupFormValues) => {
    setIsPending(true);
    const result = await updateClassGroup(classGroup.id, values);
    setIsPending(false);

    if (result.success) {
      toast({
        title: 'Turma atualizada!',
        description: result.message || 'A turma foi editada com sucesso.',
      });
      router.push('/classgroups');
      router.refresh();
    } else {
      toast({
        title: 'Erro ao atualizar',
        description: result.message || 'Verifique os dados ou tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Turma</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 3º Técnico em Farmácia" {...field} />
              </FormControl>
              <FormDescription>Identifique a turma com um nome claro.</FormDescription>
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um turno" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CLASS_GROUP_SHIFTS.map(shift => (
                    <SelectItem key={shift} value={shift}>{shift}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="classDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dias da Semana</FormLabel>
              <div className="flex flex-wrap gap-3">
                {DAYS_OF_WEEK.map(day => (
                  <FormControl key={day}>
                    <label className="flex items-center space-x-2">
                      <Checkbox
                        checked={field.value.includes(day)}
                        onCheckedChange={checked => {
                          const newDays = checked
                            ? [...field.value, day]
                            : field.value.filter(d => d !== day);
                          field.onChange(newDays);
                        }}
                      />
                      <span>{day}</span>
                    </label>
                  </FormControl>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Salvando...' : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
