
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, School } from 'lucide-react';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createClassroom, type ClassroomFormValues } from '@/lib/actions/classrooms';

const formSchema = z.object({
  name: z.string().min(1, { message: "O nome da sala é obrigatório." })
                 .min(3, { message: "O nome da sala deve ter pelo menos 3 caracteres." }),
  capacity: z.coerce.number({ invalid_type_error: "Capacidade deve ser um número." })
                     .min(1, { message: "A capacidade deve ser pelo menos 1." }),
});


export default function NewClassroomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      capacity: undefined, // Using undefined to show placeholder
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    const result = await createClassroom(values as ClassroomFormValues);
    setIsPending(false);

    if (result.success) {
      toast({
        title: 'Sucesso!',
        description: result.message,
      });
      router.push('/classrooms');
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
          <Button variant="outline" asChild>
            <Link href="/classrooms">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista
            </Link>
          </Button>
        }
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Dados da Sala</CardTitle>
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
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
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
