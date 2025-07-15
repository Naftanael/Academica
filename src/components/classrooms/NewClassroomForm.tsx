// src/components/classrooms/NewClassroomForm.tsx
'use client';

import { useEffect } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import { createClassroom } from '@/lib/actions/classrooms';
import { classroomSchema, ClassroomFormValues } from '@/lib/schemas/classrooms';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import FormSubmitButton from '@/components/shared/FormSubmitButton';

const initialState = {
  success: false,
  message: '',
  errors: undefined,
};

export default function NewClassroomForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction] = useFormState(createClassroom, initialState);

  const form = useForm<ClassroomFormValues>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      name: '',
      capacity: 0,
      isUnderMaintenance: false,
      maintenanceReason: '',
    },
    errors: state.errors,
  });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: "Sucesso!", description: state.message });
        router.push('/classrooms');
      } else {
        toast({ title: "Erro", description: state.message, variant: "destructive" });
      }
    }
  }, [state, toast, router]);

  const isUnderMaintenance = form.watch('isUnderMaintenance');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes da Nova Sala</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            action={formAction}
            onSubmit={form.handleSubmit((data) => formAction(data))}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Sala</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Sala 101, Laboratório de Informática" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidade (Alunos)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Ex: 30"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isUnderMaintenance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Sala em Manutenção (Interditada)</FormLabel>
                    <FormDescription>
                      Marque esta opção se a sala não estiver disponível para uso imediato.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {isUnderMaintenance && (
              <FormField
                control={form.control}
                name="maintenanceReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da Manutenção</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Pintura, conserto de ar condicionado..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end">
                <FormSubmitButton>Criar Sala de Aula</FormSubmitButton>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}