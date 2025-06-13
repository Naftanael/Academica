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
import { useToast } from '@/hooks/use-toast';
import { updateClassroom } from '@/lib/actions/classrooms';
import type { Classroom } from '@/types';

// Schema for the fields being edited in this form
const editClassroomFormSchema = z.object({
  name: z.string().min(1, { message: "O nome da sala é obrigatório." })
                 .min(3, { message: "O nome da sala deve ter pelo menos 3 caracteres." }),
  capacity: z.coerce.number({ invalid_type_error: "Capacidade deve ser um número." })
                     .min(1, { message: "A capacidade deve ser pelo menos 1." }),
});

type EditClassroomFormValues = z.infer<typeof editClassroomFormSchema>;

interface EditClassroomFormProps {
  classroom: Classroom;
}

export default function EditClassroomForm({ classroom }: EditClassroomFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<EditClassroomFormValues>({
    resolver: zodResolver(editClassroomFormSchema),
    defaultValues: {
      name: classroom.name,
      capacity: classroom.capacity ?? undefined,
    },
  });

  async function onSubmit(values: EditClassroomFormValues) {
    setIsPending(true);
    // The updateClassroom action expects Partial<ClassroomFormValues>
    // but our form schema matches the necessary subset.
    const result = await updateClassroom(classroom.id, values);
    setIsPending(false);

    if (result.success) {
      toast({
        title: 'Sucesso!',
        description: result.message,
      });
      router.push('/classrooms');
      router.refresh(); // Ensure data is re-fetched on the classrooms page
    } else {
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, errors]) => {
          if (errors) {
            form.setError(field as keyof EditClassroomFormValues, {
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
          title: 'Erro ao atualizar sala',
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
        {/* Fields for 'resources' and 'isLab' are omitted for simplicity in this version */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isPending ? "Salvando..." : (
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
