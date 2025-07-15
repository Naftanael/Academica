// src/components/classrooms/EditClassroomForm.tsx
'use client';

import { useEffect } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import { updateClassroom } from '@/lib/actions/classrooms';
import { classroomSchema, ClassroomFormValues } from '@/lib/schemas/classrooms';
import { useToast } from '@/hooks/use-toast';
import type { Classroom } from '@/types';

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

interface EditClassroomFormProps {
  classroom: Classroom;
}

export default function EditClassroomForm({ classroom }: EditClassroomFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const updateClassroomWithId = updateClassroom.bind(null, classroom.id);
  const [state, formAction] = useFormState(updateClassroomWithId, initialState);

  const form = useForm<ClassroomFormValues>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      name: classroom.name || '',
      capacity: classroom.capacity || undefined,
      isUnderMaintenance: classroom.isUnderMaintenance || false,
      maintenanceReason: classroom.maintenanceReason || '',
    },
  });

  useEffect(() => {
    if (state.errors) {
      for (const [key, value] of Object.entries(state.errors)) {
        if (value) {
          form.setError(key as keyof ClassroomFormValues, {
            type: 'manual',
            message: value.join(', '),
          });
        }
      }
    }
  }, [state.errors, form]);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: "Sucesso!", description: state.message });
        router.push('/classrooms');
        router.refresh();
      } else {
        toast({ title: "Erro", description: state.message, variant: "destructive" });
      }
    }
  }, [state, toast, router]);

  const isUnderMaintenance = form.watch('isUnderMaintenance');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes da Sala</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
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
                    <Input placeholder="Ex: Sala 101" {...field} />
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
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        field.onChange(isNaN(value) ? '' : value);
                      }}
                      value={field.value ?? ''}
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
                      Marque esta opção se a sala não estiver disponível para uso.
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
                      <Textarea placeholder="Ex: Infiltração no teto, projetor quebrado..." {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end">
                <FormSubmitButton>Salvar Alterações</FormSubmitButton>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
