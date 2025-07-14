
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { PlusCircle, Calendar as CalendarIconLucide } from 'lucide-react';
import { format } from 'date-fns';
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
import { DAYS_OF_WEEK, CLASS_GROUP_STATUSES, PERIODS_OF_DAY } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { Textarea } from '../ui/textarea';
import { classGroupCreateSchema, type ClassGroupCreateValues } from '@/lib/schemas/classgroups';

const saturdayShiftNote = 'Transferir aula de Sábado (Noite) para o turno da Tarde.';

export default function NewClassGroupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const currentYear = new Date().getFullYear();

  const form = useForm<ClassGroupCreateValues>({
    resolver: zodResolver(classGroupCreateSchema),
    defaultValues: {
      name: '',
      classDays: [],
      year: currentYear,
      status: 'Planejada',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      notes: '',
    },
  });

  const watchClassDays = form.watch('classDays');
  const watchShift = form.watch('shift');

  const showSaturdayCheckbox = watchClassDays.includes('Sábado') && watchShift === 'Noite';

  const handleSaturdayCheckboxChange = (checked: CheckedState) => {
    const currentNotes = form.getValues('notes') || '';
    if (checked) {
        if (!currentNotes.includes(saturdayShiftNote)) {
            const newNotes = currentNotes ? `${currentNotes}\n${saturdayShiftNote}` : saturdayShiftNote;
            form.setValue('notes', newNotes, { shouldValidate: true });
        }
    } else {
        const newNotes = currentNotes.replace(saturdayShiftNote, '').replace('\n\n', '\n').trim();
        form.setValue('notes', newNotes, { shouldValidate: true });
    }
  };

  const onSubmit = (values: ClassGroupCreateValues) => {
    startTransition(async () => {
      const result = await createClassGroup(values);
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
            form.setError(field as keyof ClassGroupCreateValues, { type: 'manual', message });
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
    });
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
                <Input placeholder="Ex: FMC10 - Téc. em Farmácia" {...field} />
              </FormControl>
              <FormDescription>Identifique a turma com um nome claro e um prefixo do curso (ex: FMC, RAD, ENF).</FormDescription>
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
                                const newSelection = checked
                                  ? [...(field.value || []), day]
                                  : (field.value || []).filter(
                                      (value) => value !== day
                                    );
                                field.onChange(newSelection);
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
                <Input type="number" placeholder={`Ex: ${currentYear}`} {...field} />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        fromDate={new Date(2022, 0, 1)}
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

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: Necessidades especiais, ajustes de horário, etc."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Adicione quaisquer notas ou observações importantes sobre esta turma.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {showSaturdayCheckbox && (
            <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-3 shadow-sm animate-in fade-in-50 duration-500">
              <Checkbox
                id="saturday-shift-change"
                onCheckedChange={handleSaturdayCheckboxChange}
                checked={form.getValues('notes')?.includes(saturdayShiftNote)}
              />
              <label
                htmlFor="saturday-shift-change"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Transferir aula de Sábado (Noite) para o turno da Tarde.
              </label>
            </FormItem>
        )}


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
