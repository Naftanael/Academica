
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
import { createClassGroup } from '@/lib/actions/classgroups';
import { CLASS_GROUP_SHIFTS, DAYS_OF_WEEK } from '@/lib/constants';
import type { ClassGroupShift, DayOfWeek } from '@/types';

// Schema based on classGroupFormSchema in actions, focused on creation fields
const newClassGroupFormSchema = z.object({
  name: z.string().min(3, { message: "O nome da turma deve ter pelo menos 3 caracteres." }),
  shift: z.enum(CLASS_GROUP_SHIFTS as [string, ...string[]], { // Cast to satisfy Zod's non-empty array requirement for enums
    required_error: "Selecione um turno.",
    invalid_type_error: "Turno inválido.",
  }),
  classDays: z.array(z.enum(DAYS_OF_WEEK as [string, ...string[]])) // Cast for enum
    .min(1, { message: "Selecione pelo menos um dia da semana." }),
  // Year, status, startDate, endDate will be defaulted by the server action
});

type NewClassGroupFormValues = z.infer<typeof newClassGroupFormSchema>;

export default function NewClassGroupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<NewClassGroupFormValues>({
    resolver: zodResolver(newClassGroupFormSchema),
    defaultValues: {
      name: '',
      shift: undefined, // Or a default shift like CLASS_GROUP_SHIFTS[0]
      classDays: [],
    },
  });

  const onSubmit = async (values: NewClassGroupFormValues) => {
    setIsPending(true);
    // The server action `createClassGroup` will handle setting default year, status, startDate, endDate
    const result = await createClassGroup(values);
    setIsPending(false);

    if (result.success) {
      toast({
        title: 'Turma criada!',
        description: result.message || 'A nova turma foi cadastrada com sucesso.',
      });
      router.push('/classgroups');
      router.refresh(); // Refresh the page to show the new class group
    } else {
      if (result.errors) {
         Object.entries(result.errors).forEach(([field, errors]) => {
          if (errors) {
             form.setError(field as keyof NewClassGroupFormValues, { // Ensure field is a key of NewClassGroupFormValues
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
          title: 'Erro ao criar turma',
          description: result.message || 'Verifique os dados ou tente novamente.',
          variant: 'destructive',
        });
      }
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
                <Input placeholder="Ex: ENF90 / Técnico em Enfermagem - Turma A" {...field} />
              </FormControl>
              <FormDescription>Identifique a turma com um nome claro (ex: Curso + Número ou Letra).</FormDescription>
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
              <FormDescription>O período do dia em que a turma terá aulas.</FormDescription>
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
              <FormDescription>Selecione os dias em que a turma terá aulas.</FormDescription>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3 pt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <FormItem // Changed from FormField to FormItem for proper structure
                    key={day}
                    className="flex flex-row items-center space-x-2 space-y-0"
                  >
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(day)}
                        onCheckedChange={(checked) => {
                          const currentDays = field.value || [];
                          if (checked) {
                            field.onChange([...currentDays, day]);
                          } else {
                            field.onChange(currentDays.filter((value) => value !== day));
                          }
                        }}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      {day}
                    </FormLabel>
                  </FormItem>
                ))}
              </div>
              <FormMessage /> {/* This FormMessage correctly corresponds to the 'classDays' FormField */}
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isPending ? 'Salvando...' : (
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
