
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
import { DAYS_OF_WEEK, PERIODS_OF_DAY } from '@/lib/constants';
import type { ClassGroup } from '@/types';
import type { CheckedState } from '@radix-ui/react-checkbox';

const formSchema = z.object({
  name: z.string().min(3, { message: "O nome da turma deve ter pelo menos 3 caracteres." }),
  shift: z.enum(PERIODS_OF_DAY, { required_error: "Selecione um turno." }),
  classDays: z.array(z.enum(DAYS_OF_WEEK))
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
                    <SelectValue placeholder="Selecione o turno da turma" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PERIODS_OF_DAY.map(period => (
                    <SelectItem key={period} value={period}>{period}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>O turno em que a turma ocorre.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="classDays"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Dias da Semana</FormLabel>
                <FormDescription>
                  Selecione os dias em que esta turma terá aulas.
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {DAYS_OF_WEEK.map((day) => (
                  <FormField
                    key={day}
                    control={form.control}
                    name="classDays"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={day}
                          className="flex flex-row items-center space-x-2 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(day)}
                              onCheckedChange={(checked: CheckedState) => {
                                return checked
                                  ? field.onChange([...(field.value || []), day])
                                  : field.onChange(
                                      (field.value || []).filter(
                                        (value) => value !== day
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {day}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
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
