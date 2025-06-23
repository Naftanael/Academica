
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { PlusCircle, Calendar as CalendarIconLucide } from 'lucide-react';
import { format, formatISO } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { createClassGroup } from '@/lib/actions/classgroups';
import { CLASS_GROUP_SHIFTS, DAYS_OF_WEEK, CLASS_GROUP_STATUSES } from '@/lib/constants';
import type { PeriodOfDay, DayOfWeek, ClassGroupStatus } from '@/types';
import { cn } from '@/lib/utils';
import type { CheckedState } from '@radix-ui/react-checkbox';

const newClassGroupFormSchema = z.object({
  name: z.string().min(3, { message: "O nome da turma deve ter pelo menos 3 caracteres." }),
  shift: z.enum(CLASS_GROUP_SHIFTS, {
    required_error: "Selecione um turno.",
  }),
  classDays: z.array(z.enum(DAYS_OF_WEEK))
    .min(1, { message: "Selecione pelo menos um dia da semana." }),
  year: z.coerce.number({ invalid_type_error: "Ano deve ser um número." })
                 .min(new Date().getFullYear() - 10, { message: "Ano muito antigo."})
                 .max(new Date().getFullYear() + 10, { message: "Ano muito no futuro."})
                 .optional(),
  status: z.enum(CLASS_GROUP_STATUSES).optional(),
  startDate: z.date({ required_error: "Data de início é obrigatória."}),
  endDate: z.date({ required_error: "Data de término é obrigatória."}),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return data.startDate <= data.endDate;
  }
  return true;
}, {
  message: "A data de início não pode ser posterior à data de término.",
  path: ["endDate"],
});

type NewClassGroupFormValues = z.infer<typeof newClassGroupFormSchema>;

export default function NewClassGroupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = React.useState(false);
  const currentYear = new Date().getFullYear();

  const form = useForm<NewClassGroupFormValues>({
    resolver: zodResolver(newClassGroupFormSchema),
    defaultValues: {
      name: '',
      shift: undefined,
      classDays: [],
      year: currentYear,
      status: 'Planejada',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    },
  });

  const onSubmit = async (values: NewClassGroupFormValues) => {
    setIsPending(true);
    const submissionValues = {
      ...values,
      startDate: values.startDate ? formatISO(values.startDate) : undefined,
      endDate: values.endDate ? formatISO(values.endDate) : undefined,
    };

    const result = await createClassGroup(submissionValues);
    setIsPending(false);

    if (result.success) {
      toast({
        title: 'Turma criada!',
        description: result.message || 'A nova turma foi cadastrada com sucesso.',
      });
      router.push('/classgroups');
      router.refresh();
    } else {
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, errorMessages]) => {
          const message = Array.isArray(errorMessages) ? errorMessages.join(', ') : String(errorMessages);
          form.setError(field as keyof NewClassGroupFormValues, { type: 'manual', message });
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
                  {CLASS_GROUP_SHIFTS.map(shiftValue => (
                    <SelectItem key={shiftValue} value={shiftValue}>{shiftValue}</SelectItem>
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
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Dias da Semana</FormLabel>
                <FormDescription>
                  Selecione os dias em que a turma terá aula.
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-2 pt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <FormField
                    key={day}
                    control={form.control}
                    name="classDays"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={day}
                          className="flex flex-row items-start space-x-2 space-y-0"
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
                          <FormLabel className="font-normal text-sm leading-tight">
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

        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ano</FormLabel>
              <FormControl>
                <Input type="number" placeholder={`Ex: ${currentYear}`} {...field} onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)} value={field.value ?? ''}/>
              </FormControl>
              <FormDescription>Ano de início/vigência da turma.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status inicial" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CLASS_GROUP_STATUSES.map(statusValue => (
                    <SelectItem key={statusValue} value={statusValue}>{statusValue}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIconLucide className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Quando a turma inicia suas atividades.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Término</FormLabel>
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
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIconLucide className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                            const startDate = form.getValues("startDate");
                            return startDate ? date < startDate : false;
                        }}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Quando a turma encerra suas atividades.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>


        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isPending ? 'Criando...' : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Turma
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
