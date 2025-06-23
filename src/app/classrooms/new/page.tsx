'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, School, Wrench } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createClassroom } from '@/lib/actions/classrooms';
import { classroomCreateSchema, type ClassroomCreateValues } from '@/lib/schemas/classrooms';


export default function NewClassroomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<ClassroomCreateValues>({
    resolver: zodResolver(classroomCreateSchema),
    defaultValues: {
      name: '',
      capacity: undefined, 
      isUnderMaintenance: false,
      maintenanceReason: '',
      // resources and isLab are optional and not form fields here, so they'll be undefined
    },
  });

  const isUnderMaintenance = form.watch('isUnderMaintenance');

  async function onSubmit(values: ClassroomCreateValues) {
    setIsPending(true);
    const result = await createClassroom(values);
    setIsPending(false);

    if (result.success) {
      toast({
        title: 'Sucesso!',
        description: result.message,
        variant: 'default',
      });
      router.push('/classrooms');
    } else {
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, errors]) => {
          if (errors) {
             form.setError(field as keyof ClassroomCreateValues, {
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
          title: 'Erro ao criar sala',
          description: result.message || 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        });
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Nova Sala de Aula"
        description="Preencha os dados para cadastrar uma nova sala."
        icon={School}
        actions={
          <Button variant="outline" asChild className="hover:bg-accent hover:text-accent-foreground">
            <Link href="/classrooms">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista
            </Link>
          </Button>
        }
      />
      <Card className="max-w-2xl mx-auto shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Dados da Sala</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Sala</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Laboratório de Informática 1" {...field} />
                    </FormControl>
                    <FormDescription>
                      O nome que identificará esta sala.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ex: 30" 
                        {...field} 
                        onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)} 
                        value={field.value === undefined ? '' : field.value}
                      />
                    </FormControl>
                    <FormDescription>
                      Número máximo de alunos que a sala comporta.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isUnderMaintenance"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-amber-50 dark:bg-amber-900/20">
                     <Wrench className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    <div className="space-y-0.5 leading-none">
                      <FormLabel className="text-base">
                        Em Manutenção?
                      </FormLabel>
                      <FormDescription>
                        Marque esta opção se a sala estiver temporariamente indisponível para uso.
                      </FormDescription>
                    </div>
                    <FormControl className="ml-auto!important mr-2">
                       <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Marcar como em manutenção"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {isUnderMaintenance && (
                <FormField
                  control={form.control}
                  name="maintenanceReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo da Manutenção (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Ar condicionado quebrado, pintura, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Descreva brevemente o motivo pelo qual a sala está em manutenção.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isPending ? "Salvando..." : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Cadastrar Sala
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
