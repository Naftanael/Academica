
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';

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
import { createClassGroup, type ClassGroupFormValues } from '@/lib/actions/classgroups';
import { CLASS_GROUP_SHIFTS, DAYS_OF_WEEK } from '@/lib/constants';
// AppCurso type import removed as it's no longer used

const formSchema = z.object({
  name: z.string().min(3, { message: "O nome da turma deve ter pelo menos 3 caracteres." }),
  shift: z.enum(CLASS_GROUP_SHIFTS as [string, ...string[]], { required_error: "Selecione um turno.", invalid_type_error: "Turno inválido." }),
  classDays: z.array(z.enum(DAYS_OF_WEEK as [string, ...string[]]))
    .min(1, { message: "Selecione pelo menos um dia da semana." }),
  // appCursoId field removed from schema
});

// Interface NewClassGroupFormProps removed as appCursos is no longer a prop
// interface NewClassGroupFormProps {
//   appCursos: AppCurso[];
// }

export default function NewClassGroupForm(/* { appCursos }: NewClassGroupFormProps */) { // appCursos prop removed
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      shift: undefined,
      classDays: [],
      // appCursoId: undefined, // Removed
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    // The createClassGroup action now expects values that match the updated schema (without appCursoId)
    const result = await createClassGroup(values as ClassGroupFormValues);
    setIsPending(false);

    if (result.success) {
      toast({
        title: 'Sucesso!',
        description: result.message,
      });
      router.push('/classgroups');
    } else {
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, errors]) => {
          if (errors) {
            form.setError(field as keyof z.infer<typeof formSchema>, {
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
          title: 'Erro ao criar turma',
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Turma</FormLabel>
              <FormControl>
                <Input placeholder="Ex: ADS 2024.1 - A" {...field} />
              </FormControl>
              <FormDescription>
                O nome que identificará esta turma.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* FormField for appCursoId removed */}
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
                  {CLASS_GROUP_SHIFTS.map((shift) => (
                    <SelectItem key={shift} value={shift}>
                      {shift}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                O período em que as aulas da turma ocorrerão.
              </FormDescription>
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
                <FormLabel className="text-base">Dias de Aula</FormLabel>
                <FormDescription>
                  Selecione os dias da semana em que haverá aula para esta turma.
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
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(day)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, day])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== day
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {day}
                        </FormLabel>
                      </FormItem>
                    )
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
            {isPending ? "Salvando..." : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Cadastrar Turma
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
